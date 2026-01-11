import { v } from "convex/values";
import invariant from "tiny-invariant";

import { authedMutation, authedQuery } from "./functions";

/**
 * Get all spaces where the current user is the teacher
 * Used on teacher dashboard to show list of students
 */
export const getMySpacesAsTeacher = authedQuery({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher", (q) => q.eq("teacherId", ctx.user.id))
      .collect();

    // Return spaces with placeholder user info
    // TODO: Store user names in teacher/student tables for display
    const enrichedSpaces = spaces.map((space) => ({
      ...space,
      studentName: "Student",
      studentEmail: "",
    }));

    // Sort by most recent first
    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all spaces where the current user is the student
 * Used on student dashboard to show list of teachers/courses
 */
export const getMySpacesAsStudent = authedQuery({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_student", (q) => q.eq("studentId", ctx.user.id))
      .collect();

    // Enrich with homework count
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => {
        // Count incomplete homework items
        const incompleteHomework = await ctx.db
          .query("homeworkItems")
          .withIndex("by_space", (q) => q.eq("spaceId", space._id))
          .filter((q) => q.eq(q.field("completedAt"), undefined))
          .collect();

        return {
          ...space,
          teacherName: "Teacher",
          teacherEmail: "",
          pendingHomeworkCount: incompleteHomework.length,
        };
      })
    );

    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single space by ID with full details
 * Validates that the current user is either the teacher or student
 */
export const getSpace = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return null;
    }

    // Verify access
    if (space.teacherId !== ctx.user.id && space.studentId !== ctx.user.id) {
      return null;
    }

    // Get lesson count
    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", space._id))
      .collect();

    // Get homework stats
    const allHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", space._id))
      .collect();

    const pendingHomework = allHomework.filter((h) => !h.completedAt);
    const completedHomework = allHomework.filter((h) => h.completedAt);

    return {
      ...space,
      teacherName: "Teacher",
      teacherEmail: "",
      studentName: "Student",
      studentEmail: "",
      lessonCount: lessons.length,
      pendingHomeworkCount: pendingHomework.length,
      completedHomeworkCount: completedHomework.length,
      isTeacher: space.teacherId === ctx.user.id,
      isStudent: space.studentId === ctx.user.id,
    };
  },
});

/**
 * Create a new space directly (used internally, not typically called by UI)
 * The invite flow is the primary way spaces are created
 */
export const createSpace = authedMutation({
  args: {
    studentId: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate teacher exists
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    invariant(teacher, "Only teachers can create spaces");

    // Validate student exists
    const student = await ctx.db
      .query("student")
      .withIndex("by_userId", (q) => q.eq("userId", args.studentId))
      .first();

    invariant(student, "Student not found");

    // Check if space already exists for this teacher-student-language combo
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", ctx.user.id).eq("studentId", args.studentId),
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === args.language.toLowerCase(),
    );

    invariant(
      !duplicateLanguage,
      `A space for ${args.language} already exists with this student`,
    );

    // Create the space
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: ctx.user.id,
      studentId: args.studentId,
      language: args.language,
      createdAt: Date.now(),
    });

    return spaceId;
  },
});

/**
 * Delete a space and all associated data
 * Only the teacher can delete a space
 */
export const deleteSpace = authedMutation({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const space = await ctx.db.get(args.spaceId);
    invariant(space, "Space not found");

    // Only teacher can delete
    invariant(
      space.teacherId === ctx.user.id,
      "Only the teacher can delete a space",
    );

    // Delete all homework items in this space
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    for (const item of homeworkItems) {
      await ctx.db.delete(item._id);
    }

    // Delete all documents/lessons in this space
    const documents = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    // Delete the space itself
    await ctx.db.delete(args.spaceId);

    return { success: true };
  },
});

/**
 * Update space details (currently only language can be updated)
 */
export const updateSpace = authedMutation({
  args: {
    spaceId: v.id("spaces"),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const space = await ctx.db.get(args.spaceId);
    invariant(space, "Space not found");

    // Only teacher can update
    invariant(
      space.teacherId === ctx.user.id,
      "Only the teacher can update a space",
    );

    const updates: Partial<{ language: string }> = {};

    if (args.language !== undefined) {
      updates.language = args.language;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.spaceId, updates);
    }

    return await ctx.db.get(args.spaceId);
  },
});

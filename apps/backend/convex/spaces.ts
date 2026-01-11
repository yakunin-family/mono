import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Get all spaces where the current user is the teacher
 * Used on teacher dashboard to show list of students
 */
export const getMySpacesAsTeacher = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const userId = user._id;

    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .collect();

    // Enrich with student info
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => {
        const studentUser = await authComponent.getAnyUserById(
          ctx,
          space.studentId,
        );

        return {
          ...space,
          studentName: studentUser?.name ?? "Unknown Student",
          studentEmail: studentUser?.email ?? "",
        };
      }),
    );

    // Sort by most recent first
    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all spaces where the current user is the student
 * Used on student dashboard to show list of teachers/courses
 */
export const getMySpacesAsStudent = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const userId = user._id;

    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_student", (q) => q.eq("studentId", userId))
      .collect();

    // Enrich with teacher info and homework count
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => {
        const teacherUser = await authComponent.getAnyUserById(
          ctx,
          space.teacherId,
        );

        // Count incomplete homework items
        const incompleteHomework = await ctx.db
          .query("homeworkItems")
          .withIndex("by_space", (q) => q.eq("spaceId", space._id))
          .filter((q) => q.eq(q.field("completedAt"), undefined))
          .collect();

        return {
          ...space,
          teacherName: teacherUser?.name ?? "Unknown Teacher",
          teacherEmail: teacherUser?.email ?? "",
          pendingHomeworkCount: incompleteHomework.length,
        };
      }),
    );

    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single space by ID with full details
 * Validates that the current user is either the teacher or student
 */
export const getSpace = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const userId = user._id;

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return null;
    }

    // Verify access
    if (space.teacherId !== userId && space.studentId !== userId) {
      return null;
    }

    // Get user details
    const teacherUser = await authComponent.getAnyUserById(
      ctx,
      space.teacherId,
    );

    const studentUser = await authComponent.getAnyUserById(
      ctx,
      space.studentId,
    );

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
      teacherName: teacherUser?.name ?? "Unknown Teacher",
      teacherEmail: teacherUser?.email ?? "",
      studentName: studentUser?.name ?? "Unknown Student",
      studentEmail: studentUser?.email ?? "",
      lessonCount: lessons.length,
      pendingHomeworkCount: pendingHomework.length,
      completedHomeworkCount: completedHomework.length,
      isTeacher: space.teacherId === userId,
      isStudent: space.studentId === userId,
    };
  },
});

/**
 * Create a new space directly (used internally, not typically called by UI)
 * The invite flow (Task 2) is the primary way spaces are created
 */
export const createSpace = mutation({
  args: {
    studentId: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const userId = user._id;

    // Validate teacher exists and has teacher role
    const teacherProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!teacherProfile || !teacherProfile.roles.includes("teacher")) {
      throw new Error("Only teachers can create spaces");
    }

    // Validate student exists
    const studentUser = await authComponent.getAnyUserById(ctx, args.studentId);

    if (!studentUser) {
      throw new Error("Student not found");
    }

    // Check if space already exists for this teacher-student-language combo
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", userId).eq("studentId", args.studentId),
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === args.language.toLowerCase(),
    );

    if (duplicateLanguage) {
      throw new Error(
        `A space for ${args.language} already exists with this student`,
      );
    }

    // Create the space
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: userId,
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
export const deleteSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const userId = user._id;

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    // Only teacher can delete
    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can delete a space");
    }

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
export const updateSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const userId = user._id;

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    // Only teacher can update
    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can update a space");
    }

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

import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Create a new lesson (teacher action)
export const createLesson = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if teacher role is active
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!profile?.isTeacherActive) {
      throw new Error("Teacher role not activated");
    }

    const now = Date.now();
    const lessonId = await ctx.db.insert("lessons", {
      teacherId: user._id,
      title: args.title,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });

    return lessonId;
  },
});

// Get lessons created by the current user as teacher
export const getTeacherLessons = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get lessons created by this teacher
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", user._id))
      .order("desc")
      .collect();

    // For each lesson, get the count of students who have access
    const lessonsWithStudentCount = await Promise.all(
      lessons.map(async (lesson) => {
        const accessRecords = await ctx.db
          .query("lessonAccess")
          .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
          .collect();

        return {
          ...lesson,
          studentCount: accessRecords.length,
        };
      })
    );

    return lessonsWithStudentCount;
  },
});

// Get lessons accessible to the current user as student
export const getStudentLessons = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Get student records linked to this user
    const studentRecords = await ctx.db
      .query("students")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", user._id))
      .collect();

    // Get all lesson access records for these student records
    const allLessons = [];
    for (const studentRecord of studentRecords) {
      const accessRecords = await ctx.db
        .query("lessonAccess")
        .withIndex("by_studentRecordId", (q) =>
          q.eq("studentRecordId", studentRecord._id)
        )
        .collect();

      for (const access of accessRecords) {
        const lesson = await ctx.db.get(access.lessonId);
        if (lesson) {
          // Get teacher info
          const teacherProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", lesson.teacherId))
            .first();

          allLessons.push({
            ...lesson,
            teacherDisplayName:
              teacherProfile?.teacherDisplayName || "Unknown Teacher",
            sharedAt: access.sharedAt,
          });
        }
      }
    }

    return allLessons;
  },
});

// Get a single lesson with access check
export const getLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Check if user is the teacher who owns this lesson
    if (lesson.teacherId === user._id) {
      return { lesson, canEdit: true, role: "teacher" as const };
    }

    // Check if user is a student with access to this lesson
    const studentRecords = await ctx.db
      .query("students")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", user._id))
      .collect();

    for (const studentRecord of studentRecords) {
      const access = await ctx.db
        .query("lessonAccess")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
        .filter((q) => q.eq(q.field("studentRecordId"), studentRecord._id))
        .first();

      if (access) {
        return { lesson, canEdit: false, role: "student" as const };
      }
    }

    throw new Error("Access denied");
  },
});

// Share lesson with multiple students (teacher action)
export const shareLessonWithStudents = mutation({
  args: {
    lessonId: v.id("lessons"),
    studentIds: v.array(v.id("students")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Verify user is the teacher who owns this lesson
    if (lesson.teacherId !== user._id) {
      throw new Error("Only the lesson owner can share it");
    }

    const now = Date.now();

    // Create access records for each student (skip if already exists)
    for (const studentId of args.studentIds) {
      const existingAccess = await ctx.db
        .query("lessonAccess")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
        .filter((q) => q.eq(q.field("studentRecordId"), studentId))
        .first();

      if (!existingAccess) {
        await ctx.db.insert("lessonAccess", {
          lessonId: args.lessonId,
          studentRecordId: studentId,
          sharedAt: now,
        });
      }
    }

    return { success: true };
  },
});

// Get students who have access to a lesson (teacher action)
export const getLessonStudents = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.teacherId !== user._id) {
      return [];
    }

    const accessRecords = await ctx.db
      .query("lessonAccess")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    const students = await Promise.all(
      accessRecords.map(async (access) => {
        const student = await ctx.db.get(access.studentRecordId);
        return student
          ? {
              ...student,
              sharedAt: access.sharedAt,
            }
          : null;
      })
    );

    return students.filter((s) => s !== null);
  },
});

// Update lesson metadata (teacher action)
export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (lesson.teacherId !== user._id) {
      throw new Error("Only the lesson owner can update it");
    }

    await ctx.db.patch(args.lessonId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

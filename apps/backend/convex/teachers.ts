import { findOne } from "@convex-dev/better-auth/adapter";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

export const getTeacherByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!teacher) {
      return null;
    }

    const teacherUser = await authComponent.getAnyUserById(ctx, args.userId);

    if (!teacherUser) {
      return null;
    }

    return {
      teacher,
      name: teacherUser.name,
    };
  },
});

export const getMyStudents = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const userId = user._id;

    // Get teacher record
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!teacher) {
      return [];
    }

    // Get all enrolled students
    const enrollments = await ctx.db
      .query("teacherStudents")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", userId))
      .collect();

    // Get user profiles for each student
    const studentsWithProfiles = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userProfile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) => q.eq("userId", enrollment.studentId))
          .first();

        return {
          studentId: enrollment.studentId,
          displayName: userProfile?.userId || enrollment.studentId,
          joinedAt: enrollment.joinedAt,
        };
      }),
    );

    return studentsWithProfiles;
  },
});

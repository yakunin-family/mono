import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Generate a unique invite token
function generateInviteToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Create a student (teacher action)
export const createStudent = mutation({
  args: {
    nickname: v.string(),
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

    // Create student with unique invite token
    const inviteToken = generateInviteToken();
    const studentId = await ctx.db.insert("students", {
      teacherId: user._id,
      nickname: args.nickname,
      inviteToken,
      createdAt: Date.now(),
    });

    return {
      studentId,
      inviteToken,
    };
  },
});

// Get all students created by the current teacher
export const getMyStudents = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const students = await ctx.db
      .query("students")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", user._id))
      .collect();

    return students;
  },
});

// Get student by invite token (for invite link flow)
export const getStudentByInviteToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("students")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.token))
      .first();

    return student;
  },
});

// Link a student record to a user account (after signup via invite link)
export const linkStudentToUser = mutation({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Find the student record by invite token
    const student = await ctx.db
      .query("students")
      .withIndex("by_inviteToken", (q) => q.eq("inviteToken", args.inviteToken))
      .first();

    if (!student) {
      throw new Error("Invalid invite token");
    }

    if (student.linkedUserId) {
      throw new Error("This invite has already been used");
    }

    // Link the student to the user
    await ctx.db.patch(student._id, {
      linkedUserId: user._id,
    });

    // Activate student role for this user
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        isStudentActive: true,
        activeRole: "student",
      });
    }

    return {
      success: true,
      studentId: student._id,
    };
  },
});

// Get all student records linked to the current user
export const getMyStudentRecords = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const studentRecords = await ctx.db
      .query("students")
      .withIndex("by_linkedUserId", (q) => q.eq("linkedUserId", user._id))
      .collect();

    return studentRecords;
  },
});

import { authedMutation, authedQuery } from "./functions";

/**
 * Ensure user profile exists and set teacher role.
 * Idempotent - safe to call multiple times.
 */
export const ensureTeacherRole = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        name: ctx.user.name,
        isTeacher: true,
      });
      return existingProfile._id;
    }

    return await ctx.db.insert("userProfile", {
      userId: ctx.user.id,
      name: ctx.user.name,
      createdAt: Date.now(),
      isTeacher: true,
      isStudent: false,
    });
  },
});

/**
 * Ensure user profile exists and set student role.
 * Idempotent - safe to call multiple times.
 */
export const ensureStudentRole = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        name: ctx.user.name,
        isStudent: true,
      });
      return existingProfile._id;
    }

    return await ctx.db.insert("userProfile", {
      userId: ctx.user.id,
      name: ctx.user.name,
      createdAt: Date.now(),
      isTeacher: false,
      isStudent: true,
    });
  },
});

/**
 * Get current user's unified profile.
 */
export const getMyProfile = authedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();
  },
});

/**
 * Check if current user has teacher role.
 */
export const isTeacher = authedQuery({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();
    return profile?.isTeacher ?? false;
  },
});

/**
 * Check if current user has student role.
 */
export const isStudent = authedQuery({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();
    return profile?.isStudent ?? false;
  },
});

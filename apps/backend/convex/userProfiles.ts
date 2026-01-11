import { authedMutation, authedQuery } from "./functions";

/**
 * Create a teacher record for the current user.
 * Idempotent - returns existing record if already exists.
 */
export const createTeacher = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("teacher", {
      userId: ctx.user.id,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a student record for the current user.
 * Idempotent - returns existing record if already exists.
 */
export const createStudent = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("student")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("student", {
      userId: ctx.user.id,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get the current user's teacher record.
 */
export const getTeacher = authedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();
  },
});

/**
 * Get the current user's student record.
 */
export const getStudent = authedQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("student")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();
  },
});

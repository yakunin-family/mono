import { v } from "convex/values";

import { query } from "./_generated/server";

export const getTeacherByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use unified userProfile table
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile || !profile.isTeacher) {
      return null;
    }

    return {
      teacher: profile,
      name: profile.name ?? null,
    };
  },
});

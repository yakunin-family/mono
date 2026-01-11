import { v } from "convex/values";

import { query } from "./_generated/server";
import { authComponent } from "./auth";

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


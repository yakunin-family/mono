import invariant from "tiny-invariant";

import { mutation } from "./_generated/server";
import { authComponent } from "./auth";

// Generate a unique invite token
function generateInviteToken(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const getToken = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    invariant(teacher, "Only teachers can create student invite links");

    const token = generateInviteToken();
    await ctx.db.insert("invite", {
      teacherId: teacher._id,
      token,
      createdAt: Date.now(),
    });

    return token;
  },
});

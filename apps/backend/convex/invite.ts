import invariant from "tiny-invariant";

import { authedMutation } from "./functions";

function generateInviteToken(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const getToken = authedMutation({
  args: {},
  handler: async (ctx) => {
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
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

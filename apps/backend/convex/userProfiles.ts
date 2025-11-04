import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { userRolesValidator } from "./schema";

export const create = mutation({
  args: {
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { role }) => {
    const user = await authComponent.getAuthUser(ctx);

    await ctx.db.insert("userProfile", {
      userId: user._id,
      roles: [role],
      activeRole: role,
    });

    if (role === "teacher") {
      await ctx.db.insert("teacher", {
        userId: user._id,
        createdAt: Date.now(),
      });
    }

    if (role === "student") {
      await ctx.db.insert("student", {
        userId: user._id,
        createdAt: Date.now(),
      });
    }
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});

export const updateActiveRole = mutation({
  args: {
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      activeRole: args.role,
    });
  },
});

export const activateRole = mutation({
  args: {
    role: userRolesValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.roles.includes(args.role)) {
      throw new Error("Role already activated");
    }

    await ctx.db.patch(profile._id, {
      roles: Array.from(new Set([...profile.roles, args.role])),
      activeRole: args.role,
    });

    if (args.role === "student") {
      await ctx.db.insert("student", {
        userId: user._id,
        createdAt: Date.now(),
      });
    }

    if (args.role === "teacher") {
      await ctx.db.insert("teacher", {
        userId: user._id,
        createdAt: Date.now(),
      });
    }
  },
});

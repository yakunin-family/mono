import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const createUserProfile = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { userId, role, displayName }) => {
    await ctx.db.insert("userProfiles", {
      userId,
      teacherDisplayName: role === "teacher" ? displayName : undefined,
      isTeacherActive: role === "teacher",
      isStudentActive: role === "student",
      activeRole: role,
    });
  },
});

// Get user profile (auto-creates if doesn't exist)
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});

// Update the last used role (for default landing page)
export const updateLastUsedRole = mutation({
  args: {
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
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

// Activate teacher role (called after payment/subscription)
export const activateTeacherRole = mutation({
  args: {
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      isTeacherActive: true,
      teacherDisplayName: args.displayName,
      activeRole: "teacher",
    });
  },
});

// Activate student role (called when joining via invite link)
export const activateStudentRole = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      isStudentActive: true,
      activeRole: "student",
    });
  },
});

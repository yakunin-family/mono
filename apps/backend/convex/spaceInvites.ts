import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Generate a URL-safe random token (24 characters, alphanumeric)
 */
function generateToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create a new invite link for a specific language.
 * Teacher specifies the language, gets back a shareable token.
 */
export const createInvite = mutation({
  args: {
    language: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Validate teacher role by checking the teacher table
    const teacher = await ctx.db
      .query("teacher")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!teacher) {
      throw new Error("Only teachers can create invites");
    }

    // Validate language is not empty
    const language = args.language.trim();
    if (!language) {
      throw new Error("Language is required");
    }

    // Generate unique token
    let token = generateToken();

    // Ensure token is unique (unlikely collision but check anyway)
    let existingToken = await ctx.db
      .query("spaceInvites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    while (existingToken) {
      token = generateToken();
      existingToken = await ctx.db
        .query("spaceInvites")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
    }

    const now = Date.now();
    const expiresAt = args.expiresInDays
      ? now + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    const inviteId = await ctx.db.insert("spaceInvites", {
      teacherId: user._id,
      language,
      token,
      createdAt: now,
      expiresAt,
    });

    return {
      inviteId,
      token,
      language,
    };
  },
});

/**
 * Get all invites created by the current teacher.
 * Shows both pending and used invites with status info.
 */
export const getMyInvites = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return [];
    }

    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
      .collect();

    // Enrich with student info for used invites
    const enrichedInvites = await Promise.all(
      invites.map(async (invite) => {
        let studentName: string | undefined;

        if (invite.usedBy) {
          const studentUser = await authComponent.getAnyUserById(
            ctx,
            invite.usedBy,
          );
          studentName = studentUser?.name ?? "Unknown Student";
        }

        const isExpired = invite.expiresAt
          ? invite.expiresAt < Date.now()
          : false;
        const isPending = !invite.usedAt && !isExpired;

        return {
          ...invite,
          studentName,
          isExpired,
          isPending,
          isUsed: !!invite.usedAt,
        };
      }),
    );

    // Sort: pending first, then by creation date descending
    return enrichedInvites.sort((a, b) => {
      if (a.isPending && !b.isPending) return -1;
      if (!a.isPending && b.isPending) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

/**
 * Get invite details by token (for the join page).
 * Does NOT require authentication - used to display invite info before login.
 */
export const getInviteByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("spaceInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return { error: "Invite not found" as const };
    }

    // Check if already used
    if (invite.usedAt) {
      return { error: "This invite has already been used" as const };
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { error: "This invite has expired" as const };
    }

    // Get teacher info
    const teacherUser = await authComponent.getAnyUserById(ctx, invite.teacherId);

    return {
      valid: true as const,
      language: invite.language,
      teacherName: teacherUser?.name ?? "Unknown Teacher",
      teacherId: invite.teacherId,
    };
  },
});

/**
 * Accept an invite - creates a space and marks invite as used.
 * Called by student after they log in.
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Find the invite
    const invite = await ctx.db
      .query("spaceInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invite not found");
    }

    // Check if already used
    if (invite.usedAt) {
      throw new Error("This invite has already been used");
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("This invite has expired");
    }

    // Prevent teacher from accepting their own invite
    if (invite.teacherId === user._id) {
      throw new Error("You cannot accept your own invite");
    }

    // Check if a space already exists for this teacher-student combo with same language
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", invite.teacherId).eq("studentId", user._id),
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === invite.language.toLowerCase(),
    );

    if (duplicateLanguage) {
      throw new Error(
        `You already have a ${invite.language} space with this teacher`,
      );
    }

    // Ensure user has student role in their profile
    const userProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (userProfile) {
      if (!userProfile.roles.includes("student")) {
        // Add student role
        await ctx.db.patch(userProfile._id, {
          roles: [...userProfile.roles, "student"],
        });
      }
    } else {
      // Create profile with student role
      await ctx.db.insert("userProfile", {
        userId: user._id,
        roles: ["student"],
        activeRole: "student",
      });
    }

    // Ensure student record exists
    const studentRecord = await ctx.db
      .query("student")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!studentRecord) {
      await ctx.db.insert("student", {
        userId: user._id,
        createdAt: Date.now(),
      });
    }

    // Create the space
    const now = Date.now();
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: invite.teacherId,
      studentId: user._id,
      language: invite.language,
      createdAt: now,
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedAt: now,
      usedBy: user._id,
      resultingSpaceId: spaceId,
    });

    return {
      spaceId,
      language: invite.language,
    };
  },
});

/**
 * Revoke (delete) an unused invite.
 * Only the teacher who created it can revoke.
 */
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("spaceInvites"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Only creator can revoke
    if (invite.teacherId !== user._id) {
      throw new Error("Only the invite creator can revoke it");
    }

    // Cannot revoke used invites
    if (invite.usedAt) {
      throw new Error("Cannot revoke an invite that has already been used");
    }

    await ctx.db.delete(args.inviteId);

    return { success: true };
  },
});

/**
 * Get pending invites count for teacher dashboard badge.
 */
export const getPendingInvitesCount = query({
  args: {},
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return 0;
    }

    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
      .collect();

    const now = Date.now();
    const pendingCount = invites.filter(
      (invite) =>
        !invite.usedAt && (!invite.expiresAt || invite.expiresAt > now),
    ).length;

    return pendingCount;
  },
});

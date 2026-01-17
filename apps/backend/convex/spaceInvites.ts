import { ConvexError } from "convex/values";
import { v } from "convex/values";

import { query } from "./_generated/server";
import { authedMutation, authedQuery } from "./functions";

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
export const createInvite = authedMutation({
  args: {
    language: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate teacher role using unified userProfile table
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (!profile?.isTeacher) {
      throw new ConvexError("Only teachers can create invites");
    }

    // Validate language is not empty
    const language = args.language.trim();
    if (!language) {
      throw new ConvexError("Language is required");
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
      teacherId: ctx.user.id,
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
export const getMyInvites = authedQuery({
  args: {},
  handler: async (ctx) => {
    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", ctx.user.id))
      .collect();

    // Enrich invites with status info
    const enrichedInvites = invites.map((invite) => {
      const isExpired = invite.expiresAt
        ? invite.expiresAt < Date.now()
        : false;
      const isPending = !invite.usedAt && !isExpired;

      return {
        ...invite,
        studentName: invite.usedBy ? "Student" : undefined,
        isExpired,
        isPending,
        isUsed: !!invite.usedAt,
      };
    });

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

    // Look up teacher name from unified userProfile table
    const teacherProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", invite.teacherId))
      .first();

    return {
      valid: true as const,
      language: invite.language,
      teacherName: teacherProfile?.name ?? "Teacher",
      teacherId: invite.teacherId,
    };
  },
});

/**
 * Accept an invite - creates a space and marks invite as used.
 * Called by student after they log in.
 */
export const acceptInvite = authedMutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the invite
    const invite = await ctx.db
      .query("spaceInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    // Check if already used
    if (invite.usedAt) {
      throw new ConvexError("This invite has already been used");
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new ConvexError("This invite has expired");
    }

    // Prevent teacher from accepting their own invite
    if (invite.teacherId === ctx.user.id) {
      throw new ConvexError("You cannot accept your own invite");
    }

    // Check if a space already exists for this teacher-student combo with same language
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", invite.teacherId).eq("studentId", ctx.user.id)
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === invite.language.toLowerCase(),
    );

    if (duplicateLanguage) {
      throw new ConvexError(`You already have a ${invite.language} space with this teacher`);
    }

    // Ensure student record exists in userProfile table
    const existingProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existingProfile) {
      // Update name and ensure student role is set
      await ctx.db.patch(existingProfile._id, {
        name: ctx.user.name,
        isStudent: true,
      });
    } else {
      // Create new userProfile
      await ctx.db.insert("userProfile", {
        userId: ctx.user.id,
        name: ctx.user.name,
        createdAt: Date.now(),
        isTeacher: false,
        isStudent: true,
      });
    }

    // Create the space
    const now = Date.now();
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: invite.teacherId,
      studentId: ctx.user.id,
      language: invite.language,
      createdAt: now,
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedAt: now,
      usedBy: ctx.user.id,
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
export const revokeInvite = authedMutation({
  args: {
    inviteId: v.id("spaceInvites"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    // Only creator can revoke
    if (invite.teacherId !== ctx.user.id) {
      throw new ConvexError("Only the invite creator can revoke it");
    }

    // Cannot revoke used invites
    if (invite.usedAt) {
      throw new ConvexError("Cannot revoke an invite that has already been used");
    }

    await ctx.db.delete(args.inviteId);

    return { success: true };
  },
});

/**
 * Get pending invites count for teacher dashboard badge.
 */
export const getPendingInvitesCount = authedQuery({
  args: {},
  handler: async (ctx) => {
    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", ctx.user.id))
      .collect();

    const now = Date.now();
    const pendingCount = invites.filter(
      (invite) =>
        !invite.usedAt && (!invite.expiresAt || invite.expiresAt > now)
    ).length;

    return pendingCount;
  },
});

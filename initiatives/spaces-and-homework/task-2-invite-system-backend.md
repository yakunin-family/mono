# Task 2: Invite System Backend

## Overview

Implement the invite system that allows teachers to create invite links with a pre-specified language. When a student accepts an invite, a space is automatically created. This replaces the current generic teacher enrollment flow.

## Dependencies

- Task 0: Schema updates (tables must exist)

## Files to Create/Modify

- Create: `apps/backend/convex/spaceInvites.ts`
- Modify: `apps/backend/convex/_generated/api.d.ts` (auto-generated)

## Implementation Details

### Create New File: `apps/backend/convex/spaceInvites.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Generate a URL-safe random token
 * Using a simple approach - in production consider using nanoid
 */
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create a new invite link for a specific language
 * Teacher specifies the language, gets back a shareable token
 */
export const createInvite = mutation({
  args: {
    language: v.string(),
    expiresInDays: v.optional(v.number()), // Optional expiration
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate teacher role
    const teacherProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!teacherProfile || !teacherProfile.roles.includes("teacher")) {
      throw new Error("Only teachers can create invites");
    }

    // Validate language is not empty
    if (!args.language.trim()) {
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
      teacherId: userId,
      language: args.language.trim(),
      token,
      createdAt: now,
      expiresAt,
    });

    return {
      inviteId,
      token,
      language: args.language.trim(),
    };
  },
});

/**
 * Get all invites created by the current teacher
 * Shows both pending and used invites
 */
export const getMyInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .collect();

    // Enrich with student info for used invites
    const enrichedInvites = await Promise.all(
      invites.map(async (invite) => {
        let studentName: string | undefined;

        if (invite.usedBy) {
          const studentUser = await ctx.db
            .query("user")
            .filter((q) => q.eq(q.field("id"), invite.usedBy))
            .first();
          studentName = studentUser?.name ?? "Unknown Student";
        }

        const isExpired = invite.expiresAt ? invite.expiresAt < Date.now() : false;
        const isPending = !invite.usedAt && !isExpired;

        return {
          ...invite,
          studentName,
          isExpired,
          isPending,
          isUsed: !!invite.usedAt,
        };
      })
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
 * Get invite details by token (for the join page)
 * Does NOT require authentication - used to display invite info before login
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
      return { error: "Invite not found" };
    }

    // Check if already used
    if (invite.usedAt) {
      return { error: "This invite has already been used" };
    }

    // Check if expired
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { error: "This invite has expired" };
    }

    // Get teacher info
    const teacherUser = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("id"), invite.teacherId))
      .first();

    return {
      valid: true,
      language: invite.language,
      teacherName: teacherUser?.name ?? "Unknown Teacher",
      teacherId: invite.teacherId,
    };
  },
});

/**
 * Accept an invite - creates a space and marks invite as used
 * Called by student after they log in
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

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
    if (invite.teacherId === userId) {
      throw new Error("You cannot accept your own invite");
    }

    // Check if a space already exists for this teacher-student combo with same language
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", invite.teacherId).eq("studentId", userId)
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === invite.language.toLowerCase()
    );

    if (duplicateLanguage) {
      throw new Error(
        `You already have a ${invite.language} space with this teacher`
      );
    }

    // Ensure user has student role in their profile
    const userProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
        userId,
        roles: ["student"],
        activeRole: "student",
      });
    }

    // Ensure student record exists
    const studentRecord = await ctx.db
      .query("student")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!studentRecord) {
      await ctx.db.insert("student", {
        userId,
        createdAt: Date.now(),
      });
    }

    // Create the space
    const now = Date.now();
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: invite.teacherId,
      studentId: userId,
      language: invite.language,
      createdAt: now,
    });

    // Mark invite as used
    await ctx.db.patch(invite._id, {
      usedAt: now,
      usedBy: userId,
      resultingSpaceId: spaceId,
    });

    return {
      spaceId,
      language: invite.language,
    };
  },
});

/**
 * Revoke (delete) an unused invite
 * Only the teacher who created it can revoke
 */
export const revokeInvite = mutation({
  args: {
    inviteId: v.id("spaceInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Only creator can revoke
    if (invite.teacherId !== userId) {
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
 * Get pending invites count for teacher dashboard badge
 */
export const getPendingInvitesCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const invites = await ctx.db
      .query("spaceInvites")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .collect();

    const now = Date.now();
    const pendingCount = invites.filter(
      (invite) =>
        !invite.usedAt && (!invite.expiresAt || invite.expiresAt > now)
    ).length;

    return pendingCount;
  },
});
```

## API Reference

### Queries

| Function | Args | Auth Required | Returns | Description |
|----------|------|---------------|---------|-------------|
| `getMyInvites` | none | Yes | `Invite[]` with status | List all invites created by teacher |
| `getInviteByToken` | `token` | No | Invite info or error | Get invite details for join page |
| `getPendingInvitesCount` | none | Yes | `number` | Count of active invites |

### Mutations

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `createInvite` | `language`, `expiresInDays?` | `{ inviteId, token, language }` | Create new invite |
| `acceptInvite` | `token` | `{ spaceId, language }` | Accept invite, create space |
| `revokeInvite` | `inviteId` | `{ success: true }` | Delete unused invite |

## Invite States

```
Created → Pending → Used (creates Space)
              ↓
           Expired (if expiresAt passed)
              ↓
           Revoked (if teacher deletes)
```

## URL Structure

The invite flow uses these URLs:

```
Student App:
/join/:token  → Shows invite details, accept button
               → After accept, redirects to /spaces/:spaceId
```

Example flow:
1. Teacher creates invite for "German" → gets token `abc123XYZ`
2. Teacher shares link: `https://student-app.com/join/abc123XYZ`
3. Student clicks link → sees "Join German lessons with Mr. Smith"
4. Student logs in (if needed) → clicks "Join"
5. Space is created → student redirected to their new space

## Error Handling

| Error | When |
|-------|------|
| "Not authenticated" | User not logged in (for mutations requiring auth) |
| "Only teachers can create invites" | Non-teacher calling createInvite |
| "Language is required" | Empty language string |
| "Invite not found" | Invalid token |
| "This invite has already been used" | Trying to accept used invite |
| "This invite has expired" | Invite past expiresAt |
| "You cannot accept your own invite" | Teacher trying to accept own invite |
| "You already have a {language} space with this teacher" | Duplicate space prevention |
| "Only the invite creator can revoke it" | Wrong teacher trying to revoke |
| "Cannot revoke an invite that has already been used" | Trying to delete used invite |

## Side Effects of acceptInvite

When a student accepts an invite, the mutation:

1. **Creates space** with teacher, student, and language
2. **Marks invite as used** with timestamp and studentId
3. **Ensures student role** - adds "student" to userProfile.roles if missing
4. **Creates student record** - inserts into `student` table if missing

This mirrors the current `joinTeacher` mutation behavior but adds the space creation.

## Testing Considerations

1. Test invite creation with valid teacher
2. Test invite creation fails for non-teacher
3. Test token uniqueness
4. Test getInviteByToken returns error for used/expired invites
5. Test acceptInvite creates space correctly
6. Test acceptInvite marks invite as used
7. Test acceptInvite adds student role
8. Test acceptInvite prevents duplicate spaces
9. Test teacher cannot accept own invite
10. Test revokeInvite only works for creator
11. Test expiration logic

## Notes for AI Agent

- Token should be URL-safe (alphanumeric only)
- `getInviteByToken` does NOT require authentication - it's used on the join page before login
- When accepting, ensure all student setup is done (profile, role, student record)
- The `resultingSpaceId` field links the invite to the created space for auditing
- Consider adding rate limiting for invite creation in production
- The current `joinTeacher` flow in `apps/backend/convex/students.ts` can remain for backwards compatibility but new flows should use this invite system

# Task 1: Space CRUD Backend

## Overview

Implement backend queries and mutations for creating, reading, updating, and deleting spaces. Spaces are the core entity representing a 1:1 teaching relationship between a teacher and student for a specific language.

## Dependencies

- Task 0: Schema updates (tables must exist)

## Files to Create/Modify

- Create: `apps/backend/convex/spaces.ts`
- Modify: `apps/backend/convex/_generated/api.d.ts` (auto-generated)

## Implementation Details

### Create New File: `apps/backend/convex/spaces.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all spaces where the current user is the teacher
 * Used on teacher dashboard to show list of students
 */
export const getMySpacesAsTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher", (q) => q.eq("teacherId", userId))
      .collect();

    // Enrich with student info
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => {
        const studentUser = await ctx.db
          .query("user")
          .filter((q) => q.eq(q.field("id"), space.studentId))
          .first();

        return {
          ...space,
          studentName: studentUser?.name ?? "Unknown Student",
          studentEmail: studentUser?.email ?? "",
        };
      })
    );

    // Sort by most recent first
    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all spaces where the current user is the student
 * Used on student dashboard to show list of teachers/courses
 */
export const getMySpacesAsStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const spaces = await ctx.db
      .query("spaces")
      .withIndex("by_student", (q) => q.eq("studentId", userId))
      .collect();

    // Enrich with teacher info and homework count
    const enrichedSpaces = await Promise.all(
      spaces.map(async (space) => {
        const teacherUser = await ctx.db
          .query("user")
          .filter((q) => q.eq(q.field("id"), space.teacherId))
          .first();

        // Count incomplete homework items
        const incompleteHomework = await ctx.db
          .query("homeworkItems")
          .withIndex("by_space", (q) => q.eq("spaceId", space._id))
          .filter((q) => q.eq(q.field("completedAt"), undefined))
          .collect();

        return {
          ...space,
          teacherName: teacherUser?.name ?? "Unknown Teacher",
          teacherEmail: teacherUser?.email ?? "",
          pendingHomeworkCount: incompleteHomework.length,
        };
      })
    );

    return enrichedSpaces.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single space by ID with full details
 * Validates that the current user is either the teacher or student
 */
export const getSpace = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return null;
    }

    // Verify access
    if (space.teacherId !== userId && space.studentId !== userId) {
      return null;
    }

    // Get user details
    const teacherUser = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("id"), space.teacherId))
      .first();

    const studentUser = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("id"), space.studentId))
      .first();

    // Get lesson count
    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", space._id))
      .collect();

    // Get homework stats
    const allHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", space._id))
      .collect();

    const pendingHomework = allHomework.filter((h) => !h.completedAt);
    const completedHomework = allHomework.filter((h) => h.completedAt);

    return {
      ...space,
      teacherName: teacherUser?.name ?? "Unknown Teacher",
      teacherEmail: teacherUser?.email ?? "",
      studentName: studentUser?.name ?? "Unknown Student",
      studentEmail: studentUser?.email ?? "",
      lessonCount: lessons.length,
      pendingHomeworkCount: pendingHomework.length,
      completedHomeworkCount: completedHomework.length,
      isTeacher: space.teacherId === userId,
      isStudent: space.studentId === userId,
    };
  },
});

/**
 * Create a new space directly (used internally, not typically called by UI)
 * The invite flow (Task 2) is the primary way spaces are created
 */
export const createSpace = mutation({
  args: {
    studentId: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate teacher exists and has teacher role
    const teacherProfile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!teacherProfile || !teacherProfile.roles.includes("teacher")) {
      throw new Error("Only teachers can create spaces");
    }

    // Validate student exists
    const studentUser = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("id"), args.studentId))
      .first();

    if (!studentUser) {
      throw new Error("Student not found");
    }

    // Check if space already exists for this teacher-student-language combo
    const existingSpaces = await ctx.db
      .query("spaces")
      .withIndex("by_teacher_and_student", (q) =>
        q.eq("teacherId", userId).eq("studentId", args.studentId)
      )
      .collect();

    const duplicateLanguage = existingSpaces.find(
      (s) => s.language.toLowerCase() === args.language.toLowerCase()
    );

    if (duplicateLanguage) {
      throw new Error(
        `A space for ${args.language} already exists with this student`
      );
    }

    // Create the space
    const spaceId = await ctx.db.insert("spaces", {
      teacherId: userId,
      studentId: args.studentId,
      language: args.language,
      createdAt: Date.now(),
    });

    return spaceId;
  },
});

/**
 * Delete a space and all associated data
 * Only the teacher can delete a space
 */
export const deleteSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    // Only teacher can delete
    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can delete a space");
    }

    // Delete all homework items in this space
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    for (const item of homeworkItems) {
      await ctx.db.delete(item._id);
    }

    // Delete all documents/lessons in this space
    const documents = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }

    // Delete the space itself
    await ctx.db.delete(args.spaceId);

    return { success: true };
  },
});

/**
 * Update space details (currently only language can be updated)
 */
export const updateSpace = mutation({
  args: {
    spaceId: v.id("spaces"),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    // Only teacher can update
    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can update a space");
    }

    const updates: Partial<{ language: string }> = {};

    if (args.language !== undefined) {
      updates.language = args.language;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.spaceId, updates);
    }

    return await ctx.db.get(args.spaceId);
  },
});
```

## API Reference

### Queries

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `getMySpacesAsTeacher` | none | `Space[]` with student info | List all spaces where user is teacher |
| `getMySpacesAsStudent` | none | `Space[]` with teacher info + homework count | List all spaces where user is student |
| `getSpace` | `spaceId` | `Space` with full details or `null` | Get single space with access check |

### Mutations

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `createSpace` | `studentId`, `language` | `spaceId` | Create space (teacher only) |
| `deleteSpace` | `spaceId` | `{ success: true }` | Delete space and all content |
| `updateSpace` | `spaceId`, `language?` | Updated `Space` | Update space details |

## Access Control Summary

| Action | Teacher | Student |
|--------|---------|---------|
| View space list | ✅ Own spaces | ✅ Own spaces |
| View space details | ✅ If participant | ✅ If participant |
| Create space | ✅ | ❌ |
| Update space | ✅ | ❌ |
| Delete space | ✅ | ❌ |

## Error Handling

All mutations should throw descriptive errors:
- "Not authenticated" - User not logged in
- "Only teachers can create spaces" - Non-teacher trying to create
- "Student not found" - Invalid studentId
- "A space for {language} already exists with this student" - Duplicate prevention
- "Space not found" - Invalid spaceId
- "Only the teacher can delete/update a space" - Permission denied

## Testing Considerations

1. Test space creation with valid teacher
2. Test space creation fails for non-teacher
3. Test duplicate language prevention
4. Test getSpace returns null for non-participant
5. Test deleteSpace cascades to documents and homework
6. Test getMySpacesAsStudent includes homework count

## Notes for AI Agent

- Use `getAuthUserId` from `@convex-dev/auth/server` for authentication
- The user table is called `user` (Better Auth convention)
- User profiles are in `userProfile` table with `roles` array
- Always validate access before returning or modifying data
- Use indexes for efficient queries (`withIndex`)
- Sort results by `createdAt` descending (most recent first)
- When deleting a space, delete ALL related data (homework, documents) first

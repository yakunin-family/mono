# Task 5: Document-Space Integration Backend

## Overview

Modify the document (lesson) system to work within spaces. Documents will now belong to spaces and have lesson numbers for ordering. This task creates the backend APIs for managing lessons within a space.

## Dependencies

- Task 0: Schema updates (spaceId and lessonNumber fields on document)
- Task 1: Space CRUD backend (spaces must exist)

## Files to Modify

- `apps/backend/convex/documents.ts` - Add space-aware queries and mutations

## Current State Analysis

The current `documents.ts` has:
- `createDocument(title)` - Creates document owned by user
- `getDocument(documentId)` - Gets single document
- `getDocuments()` - Gets all documents for owner
- `updateDocumentTitle(documentId, title)` - Updates title
- `shareWithStudents(documentId, studentIds)` - Shares with students
- Various helper functions

We need to add:
- `createLesson(spaceId, title)` - Creates lesson in space with auto-numbered lessonNumber
- `getSpaceLessons(spaceId)` - Gets all lessons in space, ordered
- `getLesson(documentId)` - Gets lesson with space context
- `updateLesson(documentId, {title, lessonNumber})` - Updates lesson
- `deleteLesson(documentId)` - Deletes lesson (and its homework)
- `reorderLessons(spaceId, lessonOrder)` - Bulk reorder

## Implementation Details

### Add to `apps/backend/convex/documents.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================
// LESSON (Space-based Document) OPERATIONS
// ============================================

/**
 * Create a new lesson within a space
 * Auto-assigns the next lesson number
 */
export const createLesson = mutation({
  args: {
    spaceId: v.id("spaces"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify space exists and user is the teacher
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can create lessons in this space");
    }

    // Get the highest lesson number in this space
    const existingLessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const maxLessonNumber = existingLessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0
    );

    const now = Date.now();

    // Create the lesson
    const lessonId = await ctx.db.insert("document", {
      spaceId: args.spaceId,
      lessonNumber: maxLessonNumber + 1,
      title: args.title.trim() || "Untitled Lesson",
      createdAt: now,
      updatedAt: now,
      // owner is not set for space lessons - access is determined by space membership
    });

    return {
      lessonId,
      lessonNumber: maxLessonNumber + 1,
    };
  },
});

/**
 * Get all lessons in a space, ordered by lesson number
 */
export const getSpaceLessons = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify user has access to this space
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return [];
    }

    // Get all lessons in the space
    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    // Sort by lesson number
    return lessons.sort((a, b) => (a.lessonNumber ?? 0) - (b.lessonNumber ?? 0));
  },
});

/**
 * Get a single lesson with space context
 * Validates that user has access through space membership
 */
export const getLesson = query({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // If document has spaceId, validate through space
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      if (!space) {
        return null;
      }

      if (space.teacherId !== userId && space.studentId !== userId) {
        return null;
      }

      // Return lesson with space info
      return {
        ...document,
        spaceName: space.language,
        isTeacher: space.teacherId === userId,
        isStudent: space.studentId === userId,
      };
    }

    // Fallback: old document model (owned by teacher)
    // Check if user is owner or has shared access
    if (document.owner === userId) {
      return {
        ...document,
        isTeacher: true,
        isStudent: false,
      };
    }

    // Check shared access (old model)
    const sharedAccess = await ctx.db
      .query("sharedDocuments")
      .withIndex("by_document_and_student", (q) =>
        q.eq("documentId", args.documentId).eq("studentId", userId)
      )
      .first();

    if (sharedAccess) {
      return {
        ...document,
        isTeacher: false,
        isStudent: true,
      };
    }

    return null;
  },
});

/**
 * Update lesson details (title and/or lessonNumber)
 */
export const updateLesson = mutation({
  args: {
    documentId: v.id("document"),
    title: v.optional(v.string()),
    lessonNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Lesson not found");
    }

    // Verify teacher access
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      if (!space || space.teacherId !== userId) {
        throw new Error("Only the teacher can update this lesson");
      }
    } else if (document.owner !== userId) {
      throw new Error("Only the owner can update this document");
    }

    const updates: Partial<{
      title: string;
      lessonNumber: number;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title.trim() || "Untitled Lesson";
    }

    if (args.lessonNumber !== undefined) {
      updates.lessonNumber = args.lessonNumber;
    }

    await ctx.db.patch(args.documentId, updates);

    return await ctx.db.get(args.documentId);
  },
});

/**
 * Delete a lesson and all associated homework items
 */
export const deleteLesson = mutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Lesson not found");
    }

    // Verify teacher access
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      if (!space || space.teacherId !== userId) {
        throw new Error("Only the teacher can delete this lesson");
      }
    } else if (document.owner !== userId) {
      throw new Error("Only the owner can delete this document");
    }

    // Delete all homework items associated with this document
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const item of homeworkItems) {
      await ctx.db.delete(item._id);
    }

    // Delete the document
    await ctx.db.delete(args.documentId);

    return { success: true };
  },
});

/**
 * Reorder lessons in a space
 * Takes an array of documentIds in desired order and updates lessonNumbers
 */
export const reorderLessons = mutation({
  args: {
    spaceId: v.id("spaces"),
    lessonOrder: v.array(v.id("document")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify space and teacher access
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can reorder lessons");
    }

    // Update each lesson's lessonNumber based on position in array
    for (let i = 0; i < args.lessonOrder.length; i++) {
      const documentId = args.lessonOrder[i];
      const document = await ctx.db.get(documentId);

      if (!document) {
        throw new Error(`Lesson ${documentId} not found`);
      }

      if (document.spaceId !== args.spaceId) {
        throw new Error(`Lesson ${documentId} does not belong to this space`);
      }

      await ctx.db.patch(documentId, {
        lessonNumber: i + 1, // 1-indexed
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get next available lesson number for a space
 * Useful for UI to show "This will be Lesson #X"
 */
export const getNextLessonNumber = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Verify space access
    const space = await ctx.db.get(args.spaceId);
    if (!space || space.teacherId !== userId) {
      return null;
    }

    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const maxNumber = lessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0
    );

    return maxNumber + 1;
  },
});

/**
 * Duplicate a lesson (creates a copy in the same space)
 */
export const duplicateLesson = mutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const original = await ctx.db.get(args.documentId);
    if (!original || !original.spaceId) {
      throw new Error("Lesson not found");
    }

    // Verify teacher access
    const space = await ctx.db.get(original.spaceId);
    if (!space || space.teacherId !== userId) {
      throw new Error("Only the teacher can duplicate lessons");
    }

    // Get next lesson number
    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", original.spaceId!))
      .collect();

    const maxNumber = lessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0
    );

    const now = Date.now();

    // Create the duplicate
    const newLessonId = await ctx.db.insert("document", {
      spaceId: original.spaceId,
      lessonNumber: maxNumber + 1,
      title: `${original.title} (Copy)`,
      content: original.content, // Copy the content
      createdAt: now,
      updatedAt: now,
    });

    return {
      lessonId: newLessonId,
      lessonNumber: maxNumber + 1,
    };
  },
});
```

## API Reference

### Queries

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `getSpaceLessons` | `spaceId` | `Lesson[]` | All lessons in space, ordered |
| `getLesson` | `documentId` | `Lesson` with space context | Single lesson with access info |
| `getNextLessonNumber` | `spaceId` | `number` | Next available lesson number |

### Mutations

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `createLesson` | `spaceId`, `title` | `{ lessonId, lessonNumber }` | Create new lesson |
| `updateLesson` | `documentId`, `title?`, `lessonNumber?` | Updated `Lesson` | Update lesson details |
| `deleteLesson` | `documentId` | `{ success: true }` | Delete lesson and homework |
| `reorderLessons` | `spaceId`, `lessonOrder[]` | `{ success: true }` | Bulk reorder |
| `duplicateLesson` | `documentId` | `{ lessonId, lessonNumber }` | Copy a lesson |

## Access Control Summary

| Action | Teacher | Student |
|--------|---------|---------|
| View lessons | ✅ In own spaces | ✅ In enrolled spaces |
| Create lesson | ✅ | ❌ |
| Update lesson | ✅ | ❌ |
| Delete lesson | ✅ | ❌ |
| Reorder lessons | ✅ | ❌ |
| Duplicate lesson | ✅ | ❌ |

## Backward Compatibility

The existing document functions (`getDocument`, `getDocuments`, etc.) should continue to work for documents without `spaceId`. The new `getLesson` function handles both:

1. **New model (spaceId set)**: Access determined by space membership
2. **Old model (owner set)**: Access determined by ownership or sharedDocuments

This allows gradual migration without breaking existing functionality.

## Document Content Handling

The `content` field stores the Yjs document state as bytes. When creating a lesson:
- Initially `content` is undefined (empty document)
- Content is populated when the collaborative editor syncs

When duplicating a lesson:
- The `content` bytes are copied directly
- This preserves all exercises, blanks, and formatting

## Homework Cascade Delete

When deleting a lesson, all associated `homeworkItems` must be deleted first. This prevents orphaned homework records pointing to non-existent documents.

## Testing Considerations

1. Create lesson assigns correct lessonNumber (sequential)
2. getSpaceLessons returns sorted by lessonNumber
3. Only teacher can create/update/delete lessons
4. Student can view but not modify
5. Delete cascades to homework items
6. Reorder updates all lessonNumbers correctly
7. Duplicate copies content correctly
8. Access control works for both space and legacy documents

## Notes for AI Agent

- Keep existing document functions working (backward compatibility)
- The `by_space` index must exist on the document table (Task 0)
- Always validate space membership before operations
- Lesson numbers are 1-indexed (start at 1, not 0)
- When deleting, always clean up homework items first
- Content is binary (bytes) - copy directly without parsing
- Use `getAuthUserId` for authentication consistently

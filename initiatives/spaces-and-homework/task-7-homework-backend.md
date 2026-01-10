# Task 7: Homework System Backend

## Overview

Implement the backend for the homework system. Teachers can mark exercises as homework, students can view and complete homework, and the system tracks completion status.

## Dependencies

- Task 0: Schema updates (homeworkItems table)
- Task 5: Document-space integration (lessons exist in spaces)

## Files to Create

- `apps/backend/convex/homework.ts` - All homework-related queries and mutations

## Implementation Details

### Create New File: `apps/backend/convex/homework.ts`

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================
// HOMEWORK QUERIES
// ============================================

/**
 * Get all homework items for a space
 * Returns enriched data with lesson info
 */
export const getSpaceHomework = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify access to space
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return [];
    }

    // Get all homework items for this space
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    // Enrich with document/lesson info
    const enrichedItems = await Promise.all(
      homeworkItems.map(async (item) => {
        const document = await ctx.db.get(item.documentId);
        return {
          ...item,
          lessonTitle: document?.title ?? "Unknown Lesson",
          lessonNumber: document?.lessonNumber ?? 0,
        };
      })
    );

    // Sort: incomplete first, then by markedAt descending
    return enrichedItems.sort((a, b) => {
      // Incomplete items first
      if (!a.completedAt && b.completedAt) return -1;
      if (a.completedAt && !b.completedAt) return 1;
      // Then by markedAt (most recent first)
      return b.markedAt - a.markedAt;
    });
  },
});

/**
 * Get incomplete homework for a space
 * Used for student dashboard and homework counts
 */
export const getIncompleteHomework = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify access to space
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return [];
    }

    // Get incomplete homework items
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .filter((q) => q.eq(q.field("completedAt"), undefined))
      .collect();

    // Enrich with document info
    const enrichedItems = await Promise.all(
      homeworkItems.map(async (item) => {
        const document = await ctx.db.get(item.documentId);
        return {
          ...item,
          lessonTitle: document?.title ?? "Unknown Lesson",
          lessonNumber: document?.lessonNumber ?? 0,
        };
      })
    );

    // Sort by lesson number
    return enrichedItems.sort((a, b) => a.lessonNumber - b.lessonNumber);
  },
});

/**
 * Get homework items for a specific document/lesson
 * Used when viewing a lesson to highlight homework exercises
 */
export const getHomeworkForDocument = query({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get document to check access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return [];
    }

    // Verify access through space
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      if (!space) {
        return [];
      }
      if (space.teacherId !== userId && space.studentId !== userId) {
        return [];
      }
    } else if (document.owner !== userId) {
      // Legacy document - check shared access
      const shared = await ctx.db
        .query("sharedDocuments")
        .withIndex("by_document_and_student", (q) =>
          q.eq("documentId", args.documentId).eq("studentId", userId)
        )
        .first();
      if (!shared) {
        return [];
      }
    }

    // Get homework items for this document
    const homeworkItems = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    return homeworkItems;
  },
});

/**
 * Check if a specific exercise is homework
 * Used for quick checks in the editor
 */
export const isExerciseHomework = query({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const homeworkItem = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("exerciseInstanceId"), args.exerciseInstanceId))
      .first();

    if (!homeworkItem) {
      return null;
    }

    return {
      homeworkId: homeworkItem._id,
      isCompleted: !!homeworkItem.completedAt,
      completedAt: homeworkItem.completedAt,
      markedAt: homeworkItem.markedAt,
    };
  },
});

// ============================================
// HOMEWORK MUTATIONS (Teacher)
// ============================================

/**
 * Mark an exercise as homework
 * Only the teacher can do this
 */
export const markAsHomework = mutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Verify teacher access
    if (!document.spaceId) {
      throw new Error("Document is not in a space");
    }

    const space = await ctx.db.get(document.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can mark homework");
    }

    // Check if already marked as homework
    const existing = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("exerciseInstanceId"), args.exerciseInstanceId))
      .first();

    if (existing) {
      throw new Error("This exercise is already marked as homework");
    }

    // Create homework item
    const homeworkId = await ctx.db.insert("homeworkItems", {
      spaceId: document.spaceId,
      documentId: args.documentId,
      exerciseInstanceId: args.exerciseInstanceId,
      markedAt: Date.now(),
    });

    return { homeworkId };
  },
});

/**
 * Remove an exercise from homework
 * Only the teacher can do this
 */
export const removeFromHomework = mutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify teacher access through space
    const space = await ctx.db.get(homeworkItem.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.teacherId !== userId) {
      throw new Error("Only the teacher can remove homework");
    }

    await ctx.db.delete(args.homeworkId);

    return { success: true };
  },
});

/**
 * Bulk mark multiple exercises as homework
 * Useful for marking several exercises at once
 */
export const bulkMarkAsHomework = mutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || !document.spaceId) {
      throw new Error("Document not found or not in a space");
    }

    // Verify teacher access
    const space = await ctx.db.get(document.spaceId);
    if (!space || space.teacherId !== userId) {
      throw new Error("Only the teacher can mark homework");
    }

    // Get existing homework for this document
    const existingHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const existingIds = new Set(
      existingHomework.map((h) => h.exerciseInstanceId)
    );

    // Create homework items for exercises not already marked
    const now = Date.now();
    const created: string[] = [];

    for (const instanceId of args.exerciseInstanceIds) {
      if (!existingIds.has(instanceId)) {
        await ctx.db.insert("homeworkItems", {
          spaceId: document.spaceId,
          documentId: args.documentId,
          exerciseInstanceId: instanceId,
          markedAt: now,
        });
        created.push(instanceId);
      }
    }

    return { created, skipped: args.exerciseInstanceIds.length - created.length };
  },
});

// ============================================
// HOMEWORK MUTATIONS (Student)
// ============================================

/**
 * Mark homework as complete
 * Only the student can do this
 */
export const completeHomework = mutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify student access through space
    const space = await ctx.db.get(homeworkItem.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.studentId !== userId) {
      throw new Error("Only the student can mark homework as complete");
    }

    // Already completed?
    if (homeworkItem.completedAt) {
      return { success: true, alreadyCompleted: true };
    }

    await ctx.db.patch(args.homeworkId, {
      completedAt: Date.now(),
    });

    return { success: true, alreadyCompleted: false };
  },
});

/**
 * Undo homework completion
 * Only the student can do this
 */
export const uncompleteHomework = mutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify student access through space
    const space = await ctx.db.get(homeworkItem.spaceId);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.studentId !== userId) {
      throw new Error("Only the student can undo completion");
    }

    await ctx.db.patch(args.homeworkId, {
      completedAt: undefined,
    });

    return { success: true };
  },
});

// ============================================
// HOMEWORK STATISTICS
// ============================================

/**
 * Get homework statistics for a space
 * Used for dashboard summaries
 */
export const getHomeworkStats = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Verify access
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return null;
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return null;
    }

    const allHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const total = allHomework.length;
    const completed = allHomework.filter((h) => h.completedAt).length;
    const pending = total - completed;

    // Get recently completed (last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentlyCompleted = allHomework.filter(
      (h) => h.completedAt && h.completedAt > oneWeekAgo
    ).length;

    return {
      total,
      completed,
      pending,
      recentlyCompleted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

/**
 * Get homework completion history for a space
 * Returns a timeline of completions
 */
export const getHomeworkHistory = query({
  args: {
    spaceId: v.id("spaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Verify access
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return [];
    }

    // Get completed homework
    const completedHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .filter((q) => q.neq(q.field("completedAt"), undefined))
      .collect();

    // Sort by completedAt descending
    const sorted = completedHomework.sort(
      (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)
    );

    // Apply limit
    const limited = args.limit ? sorted.slice(0, args.limit) : sorted;

    // Enrich with document info
    const enriched = await Promise.all(
      limited.map(async (item) => {
        const document = await ctx.db.get(item.documentId);
        return {
          ...item,
          lessonTitle: document?.title ?? "Unknown Lesson",
          lessonNumber: document?.lessonNumber ?? 0,
        };
      })
    );

    return enriched;
  },
});
```

## API Reference

### Queries

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `getSpaceHomework` | `spaceId` | `HomeworkItem[]` | All homework in space |
| `getIncompleteHomework` | `spaceId` | `HomeworkItem[]` | Pending homework only |
| `getHomeworkForDocument` | `documentId` | `HomeworkItem[]` | Homework in specific document |
| `isExerciseHomework` | `documentId`, `exerciseInstanceId` | Status or null | Check single exercise |
| `getHomeworkStats` | `spaceId` | Stats object | Completion statistics |
| `getHomeworkHistory` | `spaceId`, `limit?` | `HomeworkItem[]` | Completion timeline |

### Mutations

| Function | Args | Role | Description |
|----------|------|------|-------------|
| `markAsHomework` | `documentId`, `exerciseInstanceId` | Teacher | Mark exercise as homework |
| `removeFromHomework` | `homeworkId` | Teacher | Unmark exercise |
| `bulkMarkAsHomework` | `documentId`, `exerciseInstanceIds[]` | Teacher | Mark multiple exercises |
| `completeHomework` | `homeworkId` | Student | Mark as done |
| `uncompleteHomework` | `homeworkId` | Student | Undo completion |

## Access Control Summary

| Action | Teacher | Student |
|--------|---------|---------|
| View homework | ✅ In own spaces | ✅ In enrolled spaces |
| Mark as homework | ✅ | ❌ |
| Remove homework | ✅ | ❌ |
| Complete homework | ❌ | ✅ |
| Uncomplete homework | ❌ | ✅ |
| View stats | ✅ | ✅ |

## Data Flow

```
Teacher marks exercise as homework:
1. Teacher in lesson editor
2. Clicks "Assign as Homework" on exercise
3. markAsHomework(documentId, exerciseInstanceId)
4. HomeworkItem created with spaceId, documentId, exerciseInstanceId, markedAt

Student completes homework:
1. Student sees homework in space dashboard
2. Opens lesson, exercise is highlighted
3. Completes exercise content (fills blanks, writes)
4. Clicks "Mark Complete"
5. completeHomework(homeworkId)
6. HomeworkItem.completedAt set to now

Teacher reviews:
1. Teacher sees "X pending review" in space
2. Opens lesson, sees completed homework exercises
3. (Future: AI-assisted review, manual feedback)
```

## Exercise Instance ID

The `exerciseInstanceId` is the `instanceId` attribute on Exercise nodes in the Tiptap document. This ID is:
- Generated when the exercise is created
- Persisted in the document content
- Stable across edits (doesn't change when content around it changes)

The Exercise extension already has `instanceId` as an attribute. Ensure it's always populated.

## Testing Considerations

1. markAsHomework creates correct record
2. Duplicate marking throws error
3. removeFromHomework deletes record
4. Only teacher can mark/remove
5. completeHomework sets timestamp
6. Only student can complete/uncomplete
7. getSpaceHomework returns sorted (incomplete first)
8. getHomeworkForDocument returns correct items
9. Stats calculation is accurate
10. Deletion cascade from lesson delete (Task 5)

## Notes for AI Agent

- The `exerciseInstanceId` references the Exercise node's `instanceId` attribute
- Always verify space membership before operations
- Use indexes for efficient queries
- Completed homework has `completedAt` timestamp, pending has `undefined`
- Keep mutations atomic - don't leave partial state
- Statistics are computed on-demand (no cached counters)
- Future: Add notification system for homework assignments

import { v } from "convex/values";
import invariant from "tiny-invariant";

import { verifySpaceAccess } from "./accessControl";
import { authedMutation, authedQuery } from "./functions";

// ============================================
// HOMEWORK QUERIES
// ============================================

/**
 * Get all homework items for a space
 * Returns enriched data with lesson info, sorted incomplete first then by markedAt descending
 */
export const getSpaceHomework = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    // Verify access to space
    const { hasAccess } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
    );
    if (!hasAccess) {
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
      }),
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
 * Sorted by lesson number
 */
export const getIncompleteHomework = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    // Verify access to space
    const { hasAccess } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
    );
    if (!hasAccess) {
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
      }),
    );

    // Sort by lesson number
    return enrichedItems.sort((a, b) => a.lessonNumber - b.lessonNumber);
  },
});

/**
 * Get homework items for a specific document/lesson
 * Used when viewing a lesson to highlight homework exercises
 */
export const getHomeworkForDocument = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    // Get document to check access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return [];
    }

    // Verify access through space
    if (document.spaceId) {
      const { hasAccess } = await verifySpaceAccess(
        ctx,
        document.spaceId,
        ctx.user.id,
      );
      if (!hasAccess) {
        return [];
      }
    } else if (document.owner !== ctx.user.id) {
      // Legacy document - check shared access
      const shared = await ctx.db
        .query("sharedDocuments")
        .withIndex("by_document_and_student", (q) =>
          q.eq("documentId", args.documentId).eq("studentId", ctx.user.id),
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
 * Returns status info or null if not homework
 */
export const isExerciseHomework = authedQuery({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const homeworkItem = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) =>
        q.eq(q.field("exerciseInstanceId"), args.exerciseInstanceId),
      )
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

/**
 * Get homework statistics for a space
 * Used for dashboard summaries
 */
export const getHomeworkStats = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    // Verify access
    const { hasAccess } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
    );
    if (!hasAccess) {
      return null;
    }

    const allHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const total = allHomework.length;
    const completed = allHomework.filter((h) => h.completedAt).length;
    const pending = total - completed;

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

/**
 * Get homework completion history for a space
 * Returns a timeline of completions, limited to specified count
 */
export const getHomeworkHistory = authedQuery({
  args: {
    spaceId: v.id("spaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify access
    const { hasAccess } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
    );
    if (!hasAccess) {
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
      (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0),
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
      }),
    );

    return enriched;
  },
});

// ============================================
// HOMEWORK MUTATIONS (Teacher)
// ============================================

/**
 * Mark an exercise as homework
 * Only the teacher can do this
 */
export const markAsHomework = authedMutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get document
    const document = await ctx.db.get(args.documentId);
    invariant(document, "Document not found");

    // Verify teacher access
    invariant(document.spaceId, "Document is not in a space");

    const { hasAccess, isTeacher } = await verifySpaceAccess(
      ctx,
      document.spaceId,
      ctx.user.id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isTeacher, "Only the teacher can mark homework");

    // Check if already marked as homework
    const existing = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) =>
        q.eq(q.field("exerciseInstanceId"), args.exerciseInstanceId),
      )
      .first();

    invariant(!existing, "This exercise is already marked as homework");

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
export const removeFromHomework = authedMutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const homeworkItem = await ctx.db.get(args.homeworkId);
    invariant(homeworkItem, "Homework item not found");

    // Verify teacher access through space
    const { hasAccess, isTeacher } = await verifySpaceAccess(
      ctx,
      homeworkItem.spaceId,
      ctx.user.id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isTeacher, "Only the teacher can remove homework");

    await ctx.db.delete(args.homeworkId);

    return { success: true };
  },
});

/**
 * Bulk mark multiple exercises as homework
 * Useful for marking several exercises at once
 * Only the teacher can do this
 */
export const bulkMarkAsHomework = authedMutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get document
    const document = await ctx.db.get(args.documentId);
    invariant(document && document.spaceId, "Document not found or not in a space");

    // Verify teacher access
    const { hasAccess, isTeacher } = await verifySpaceAccess(
      ctx,
      document.spaceId,
      ctx.user.id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isTeacher, "Only the teacher can mark homework");

    // Get existing homework for this document
    const existingHomework = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const existingIds = new Set(
      existingHomework.map((h) => h.exerciseInstanceId),
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

    return {
      created,
      skipped: args.exerciseInstanceIds.length - created.length,
    };
  },
});

// ============================================
// HOMEWORK MUTATIONS (Student)
// ============================================

/**
 * Mark homework as complete
 * Only the student can do this
 */
export const completeHomework = authedMutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const homeworkItem = await ctx.db.get(args.homeworkId);
    invariant(homeworkItem, "Homework item not found");

    // Verify student access through space
    const { hasAccess, isStudent } = await verifySpaceAccess(
      ctx,
      homeworkItem.spaceId,
      ctx.user.id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isStudent, "Only the student can mark homework as complete");

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
export const uncompleteHomework = authedMutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const homeworkItem = await ctx.db.get(args.homeworkId);
    invariant(homeworkItem, "Homework item not found");

    // Verify student access through space
    const { hasAccess, isStudent } = await verifySpaceAccess(
      ctx,
      homeworkItem.spaceId,
      ctx.user.id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isStudent, "Only the student can undo completion");

    await ctx.db.patch(args.homeworkId, {
      completedAt: undefined,
    });

    return { success: true };
  },
});

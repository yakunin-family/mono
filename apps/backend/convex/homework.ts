import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Verify that a user has access to a space (for queries)
 * Returns access info including role
 */
async function verifySpaceAccess(
  ctx: QueryCtx,
  spaceId: Id<"spaces">,
  userId: string,
): Promise<{ hasAccess: boolean; isTeacher: boolean; isStudent: boolean }> {
  const space = await ctx.db.get(spaceId);

  if (!space) {
    return { hasAccess: false, isTeacher: false, isStudent: false };
  }

  const isTeacher = space.teacherId === userId;
  const isStudent = space.studentId === userId;

  return {
    hasAccess: isTeacher || isStudent,
    isTeacher,
    isStudent,
  };
}

/**
 * Verify that a user has access to a space (for mutations)
 * Returns access info including role
 */
async function verifySpaceAccessMutation(
  ctx: MutationCtx,
  spaceId: Id<"spaces">,
  userId: string,
): Promise<{ hasAccess: boolean; isTeacher: boolean; isStudent: boolean }> {
  const space = await ctx.db.get(spaceId);

  if (!space) {
    return { hasAccess: false, isTeacher: false, isStudent: false };
  }

  const isTeacher = space.teacherId === userId;
  const isStudent = space.studentId === userId;

  return {
    hasAccess: isTeacher || isStudent,
    isTeacher,
    isStudent,
  };
}

// ============================================
// HOMEWORK QUERIES
// ============================================

/**
 * Get all homework items for a space
 * Returns enriched data with lesson info, sorted incomplete first then by markedAt descending
 */
export const getSpaceHomework = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Verify access to space
    const { hasAccess } = await verifySpaceAccess(ctx, args.spaceId, user._id);
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
export const getIncompleteHomework = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Verify access to space
    const { hasAccess } = await verifySpaceAccess(ctx, args.spaceId, user._id);
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
export const getHomeworkForDocument = query({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

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
        user._id,
      );
      if (!hasAccess) {
        return [];
      }
    } else if (document.owner !== user._id) {
      // Legacy document - check shared access
      const shared = await ctx.db
        .query("sharedDocuments")
        .withIndex("by_document_and_student", (q) =>
          q.eq("documentId", args.documentId).eq("studentId", user._id),
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
export const isExerciseHomework = query({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

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
export const getHomeworkStats = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    // Verify access
    const { hasAccess } = await verifySpaceAccess(ctx, args.spaceId, user._id);
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
export const getHomeworkHistory = query({
  args: {
    spaceId: v.id("spaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    // Verify access
    const { hasAccess } = await verifySpaceAccess(ctx, args.spaceId, user._id);
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
export const markAsHomework = mutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
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

    const { hasAccess, isTeacher } = await verifySpaceAccessMutation(
      ctx,
      document.spaceId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Space not found");
    }

    if (!isTeacher) {
      throw new Error("Only the teacher can mark homework");
    }

    // Check if already marked as homework
    const existing = await ctx.db
      .query("homeworkItems")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) =>
        q.eq(q.field("exerciseInstanceId"), args.exerciseInstanceId),
      )
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
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify teacher access through space
    const { hasAccess, isTeacher } = await verifySpaceAccessMutation(
      ctx,
      homeworkItem.spaceId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Space not found");
    }

    if (!isTeacher) {
      throw new Error("Only the teacher can remove homework");
    }

    await ctx.db.delete(args.homeworkId);

    return { success: true };
  },
});

/**
 * Bulk mark multiple exercises as homework
 * Useful for marking several exercises at once
 * Only the teacher can do this
 */
export const bulkMarkAsHomework = mutation({
  args: {
    documentId: v.id("document"),
    exerciseInstanceIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || !document.spaceId) {
      throw new Error("Document not found or not in a space");
    }

    // Verify teacher access
    const { hasAccess, isTeacher } = await verifySpaceAccessMutation(
      ctx,
      document.spaceId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Space not found");
    }

    if (!isTeacher) {
      throw new Error("Only the teacher can mark homework");
    }

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
export const completeHomework = mutation({
  args: {
    homeworkId: v.id("homeworkItems"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify student access through space
    const { hasAccess, isStudent } = await verifySpaceAccessMutation(
      ctx,
      homeworkItem.spaceId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Space not found");
    }

    if (!isStudent) {
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
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const homeworkItem = await ctx.db.get(args.homeworkId);
    if (!homeworkItem) {
      throw new Error("Homework item not found");
    }

    // Verify student access through space
    const { hasAccess, isStudent } = await verifySpaceAccessMutation(
      ctx,
      homeworkItem.spaceId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Space not found");
    }

    if (!isStudent) {
      throw new Error("Only the student can undo completion");
    }

    await ctx.db.patch(args.homeworkId, {
      completedAt: undefined,
    });

    return { success: true };
  },
});

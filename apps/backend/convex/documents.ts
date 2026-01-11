import { v } from "convex/values";
import invariant from "tiny-invariant";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper function to check if user has access to a document (for queries)
 * Supports space-based access (new model) and owner/shared access (legacy)
 */
async function hasDocumentAccess(
  ctx: QueryCtx,
  documentId: Id<"document">,
  userId: string,
): Promise<boolean> {
  const document = await ctx.db.get(documentId);

  if (!document) {
    return false;
  }

  // New model: space-based access
  if (document.spaceId) {
    const space = await ctx.db.get(document.spaceId);
    if (space && (space.teacherId === userId || space.studentId === userId)) {
      return true;
    }
  }

  // Legacy model: owner check
  if (document.owner === userId) {
    return true;
  }

  // Legacy model: shared access check
  const share = await ctx.db
    .query("sharedDocuments")
    .withIndex("by_document_and_student", (q) =>
      q.eq("documentId", documentId).eq("studentId", userId),
    )
    .first();

  return share !== null;
}

/**
 * Helper function to check if user has access to a document (for mutations)
 * Supports space-based access (new model) and owner/shared access (legacy)
 */
async function hasDocumentAccessMutation(
  ctx: MutationCtx,
  documentId: Id<"document">,
  userId: string,
): Promise<boolean> {
  const document = await ctx.db.get(documentId);

  if (!document) {
    return false;
  }

  // New model: space-based access
  if (document.spaceId) {
    const space = await ctx.db.get(document.spaceId);
    if (space && (space.teacherId === userId || space.studentId === userId)) {
      return true;
    }
  }

  // Legacy model: owner check
  if (document.owner === userId) {
    return true;
  }

  // Legacy model: shared access check
  const share = await ctx.db
    .query("sharedDocuments")
    .withIndex("by_document_and_student", (q) =>
      q.eq("documentId", documentId).eq("studentId", userId),
    )
    .first();

  return share !== null;
}


/**
 * Get a single document by ID
 */
export const getDocument = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, documentId, user._id);

    invariant(hasAccess, "Not authorized to access this document");

    return document;
  },
});

/**
 * Update document title
 */
export const updateDocumentTitle = mutation({
  args: {
    documentId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const document = await ctx.db.get(args.documentId as Id<"document">);

    invariant(document, "Document not found");

    // Check access through space membership or legacy owner
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      invariant(
        space && space.teacherId === user._id,
        "Not authorized to modify this document",
      );
    } else {
      invariant(
        document.owner === user._id,
        "Not authorized to modify this document",
      );
    }

    await ctx.db.patch(args.documentId as Id<"document">, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save document content (Yjs state)
 */
export const saveDocumentContent = mutation({
  args: {
    documentId: v.string(),
    content: v.bytes(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccessMutation(
      ctx,
      documentId,
      user._id,
    );

    invariant(hasAccess, "Not authorized to modify this document");

    await ctx.db.patch(documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Load document content (Yjs state)
 */
export const loadDocumentContent = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, documentId, user._id);

    invariant(hasAccess, "Not authorized to access this document");

    return document.content || null;
  },
});


/**
 * Get all lessons (documents) for a specific space
 * Used on student and teacher space detail pages
 */
export const getSpaceLessons = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Check space access
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    // Verify user is either teacher or student
    if (space.teacherId !== user._id && space.studentId !== user._id) {
      return [];
    }

    // Get all documents for this space
    const documents = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    // Sort by lesson number
    return documents.sort((a, b) => {
      const aNum = a.lessonNumber ?? 0;
      const bNum = b.lessonNumber ?? 0;
      return aNum - bNum;
    });
  },
});

// ============================================
// LESSON (Space-based Document) OPERATIONS
// ============================================

/**
 * Helper function to check if user has space membership (for queries)
 */
async function hasSpaceAccess(
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
 * Helper function to check if user has space membership (for mutations)
 */
async function hasSpaceAccessMutation(
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

/**
 * Get a single lesson with space context
 * Supports both new space-based access and old owner-based access for backward compatibility
 */
export const getLesson = query({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      return null;
    }

    // If document has spaceId, validate through space membership
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      if (!space) {
        return null;
      }

      const isTeacher = space.teacherId === user._id;
      const isStudent = space.studentId === user._id;

      if (!isTeacher && !isStudent) {
        return null;
      }

      // Return lesson with space info
      return {
        ...document,
        spaceName: space.language,
        isTeacher,
        isStudent,
      };
    }

    // Fallback: old document model (owned by teacher)
    // Check if user is owner
    if (document.owner === user._id) {
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
        q.eq("documentId", args.documentId).eq("studentId", user._id),
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
 * Get next available lesson number for a space
 * Useful for UI to show "This will be Lesson #X"
 */
export const getNextLessonNumber = query({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Verify space access (only teacher should see this)
    const { isTeacher } = await hasSpaceAccess(ctx, args.spaceId, user._id);

    if (!isTeacher) {
      return null;
    }

    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const maxNumber = lessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0,
    );

    return maxNumber + 1;
  },
});

/**
 * Create a new lesson within a space
 * Auto-assigns the next lesson number (1-indexed)
 */
export const createLesson = mutation({
  args: {
    spaceId: v.id("spaces"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Verify space exists and user is the teacher
    const { hasAccess, isTeacher } = await hasSpaceAccessMutation(
      ctx,
      args.spaceId,
      user._id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isTeacher, "Only the teacher can create lessons in this space");

    // Get the highest lesson number in this space
    const existingLessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();

    const maxLessonNumber = existingLessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0,
    );

    const now = Date.now();

    // Create the lesson
    const lessonId = await ctx.db.insert("document", {
      spaceId: args.spaceId,
      lessonNumber: maxLessonNumber + 1,
      title: args.title.trim() || "Untitled Lesson",
      createdAt: now,
      updatedAt: now,
    });

    return {
      lessonId,
      lessonNumber: maxLessonNumber + 1,
    };
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
    const user = await authComponent.getAuthUser(ctx);

    const document = await ctx.db.get(args.documentId);

    invariant(document, "Lesson not found");

    // Verify teacher access
    if (document.spaceId) {
      const { isTeacher } = await hasSpaceAccessMutation(
        ctx,
        document.spaceId,
        user._id,
      );
      invariant(isTeacher, "Only the teacher can update this lesson");
    } else {
      invariant(
        document.owner === user._id,
        "Only the owner can update this document",
      );
    }

    const updates: {
      title?: string;
      lessonNumber?: number;
      updatedAt: number;
    } = {
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
    const user = await authComponent.getAuthUser(ctx);

    const document = await ctx.db.get(args.documentId);

    invariant(document, "Lesson not found");

    // Verify teacher access
    if (document.spaceId) {
      const { isTeacher } = await hasSpaceAccessMutation(
        ctx,
        document.spaceId,
        user._id,
      );
      invariant(isTeacher, "Only the teacher can delete this lesson");
    } else {
      invariant(
        document.owner === user._id,
        "Only the owner can delete this document",
      );
    }

    // Delete all homework items associated with this document first (cascade delete)
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
 * Takes an array of documentIds in desired order and updates lessonNumbers (1-indexed)
 */
export const reorderLessons = mutation({
  args: {
    spaceId: v.id("spaces"),
    lessonOrder: v.array(v.id("document")),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    // Verify space and teacher access
    const { hasAccess, isTeacher } = await hasSpaceAccessMutation(
      ctx,
      args.spaceId,
      user._id,
    );

    invariant(hasAccess, "Space not found");
    invariant(isTeacher, "Only the teacher can reorder lessons");

    // Update each lesson's lessonNumber based on position in array
    for (let i = 0; i < args.lessonOrder.length; i++) {
      const documentId = args.lessonOrder[i]!;
      const document = await ctx.db.get(documentId);

      invariant(document, `Lesson ${documentId} not found`);
      invariant(
        document.spaceId === args.spaceId,
        `Lesson ${documentId} does not belong to this space`,
      );

      await ctx.db.patch(documentId, {
        lessonNumber: i + 1, // 1-indexed
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Duplicate a lesson (creates a copy in the same space with content)
 */
export const duplicateLesson = mutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const original = await ctx.db.get(args.documentId);

    invariant(original, "Lesson not found");
    invariant(original.spaceId, "Can only duplicate space-based lessons");

    // Verify teacher access
    const { isTeacher } = await hasSpaceAccessMutation(
      ctx,
      original.spaceId,
      user._id,
    );

    invariant(isTeacher, "Only the teacher can duplicate lessons");

    // Get next lesson number
    const lessons = await ctx.db
      .query("document")
      .withIndex("by_space", (q) => q.eq("spaceId", original.spaceId!))
      .collect();

    const maxNumber = lessons.reduce(
      (max, lesson) => Math.max(max, lesson.lessonNumber ?? 0),
      0,
    );

    const now = Date.now();

    // Create the duplicate (copy content as binary directly)
    const newLessonId = await ctx.db.insert("document", {
      spaceId: original.spaceId,
      lessonNumber: maxNumber + 1,
      title: `${original.title} (Copy)`,
      content: original.content, // Copy the content bytes directly
      createdAt: now,
      updatedAt: now,
    });

    return {
      lessonId: newLessonId,
      lessonNumber: maxNumber + 1,
    };
  },
});

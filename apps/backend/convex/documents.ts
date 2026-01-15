import { v } from "convex/values";
import invariant from "tiny-invariant";

import { hasDocumentAccess, verifySpaceAccess } from "./accessControl";
import { authedMutation, authedQuery } from "./functions";

/**
 * Get a single document by ID
 */
export const getDocument = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, args.documentId, ctx.user.id);

    invariant(hasAccess, "Not authorized to access this document");

    return document;
  },
});

/**
 * Update document title
 */
export const updateDocumentTitle = authedMutation({
  args: {
    documentId: v.id("document"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Document not found");

    // Check access through space membership or legacy owner
    if (document.spaceId) {
      const space = await ctx.db.get(document.spaceId);
      invariant(
        space && space.teacherId === ctx.user.id,
        "Not authorized to modify this document",
      );
    } else {
      invariant(
        document.owner === ctx.user.id,
        "Not authorized to modify this document",
      );
    }

    await ctx.db.patch(args.documentId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save document content (Yjs state)
 */
export const saveDocumentContent = authedMutation({
  args: {
    documentId: v.id("document"),
    content: v.bytes(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, args.documentId, ctx.user.id);

    invariant(hasAccess, "Not authorized to modify this document");

    await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Load document content (Yjs state)
 */
export const loadDocumentContent = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Document not found");

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, args.documentId, ctx.user.id);

    invariant(hasAccess, "Not authorized to access this document");

    return document.content || null;
  },
});

/**
 * Get all lessons (documents) for a specific space
 * Used on student and teacher space detail pages
 */
export const getSpaceLessons = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    // Check space access
    const space = await ctx.db.get(args.spaceId);
    if (!space) {
      return [];
    }

    // Verify user is either teacher or student
    if (space.teacherId !== ctx.user.id && space.studentId !== ctx.user.id) {
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
 * Get a single lesson with space context
 * Supports both new space-based access and old owner-based access for backward compatibility
 */
export const getLesson = authedQuery({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
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

      const isTeacher = space.teacherId === ctx.user.id;
      const isStudent = space.studentId === ctx.user.id;

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
    if (document.owner === ctx.user.id) {
      return {
        ...document,
        isTeacher: true,
        isStudent: false,
      };
    }

    return null;
  },
});

/**
 * Get next available lesson number for a space
 * Useful for UI to show "This will be Lesson #X"
 */
export const getNextLessonNumber = authedQuery({
  args: {
    spaceId: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    // Verify space access (only teacher should see this)
    const { isTeacher } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
    );

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
export const createLesson = authedMutation({
  args: {
    spaceId: v.id("spaces"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify space exists and user is the teacher
    const { hasAccess, isTeacher } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
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
export const updateLesson = authedMutation({
  args: {
    documentId: v.id("document"),
    title: v.optional(v.string()),
    lessonNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Lesson not found");

    // Verify teacher access
    if (document.spaceId) {
      const { isTeacher } = await verifySpaceAccess(
        ctx,
        document.spaceId,
        ctx.user.id,
      );
      invariant(isTeacher, "Only the teacher can update this lesson");
    } else {
      invariant(
        document.owner === ctx.user.id,
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
export const deleteLesson = authedMutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);

    invariant(document, "Lesson not found");

    // Verify teacher access
    if (document.spaceId) {
      const { isTeacher } = await verifySpaceAccess(
        ctx,
        document.spaceId,
        ctx.user.id,
      );
      invariant(isTeacher, "Only the teacher can delete this lesson");
    } else {
      invariant(
        document.owner === ctx.user.id,
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
export const reorderLessons = authedMutation({
  args: {
    spaceId: v.id("spaces"),
    lessonOrder: v.array(v.id("document")),
  },
  handler: async (ctx, args) => {
    // Verify space and teacher access
    const { hasAccess, isTeacher } = await verifySpaceAccess(
      ctx,
      args.spaceId,
      ctx.user.id,
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
export const duplicateLesson = authedMutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.documentId);

    invariant(original, "Lesson not found");
    invariant(original.spaceId, "Can only duplicate space-based lessons");

    // Verify teacher access
    const { isTeacher } = await verifySpaceAccess(
      ctx,
      original.spaceId,
      ctx.user.id,
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

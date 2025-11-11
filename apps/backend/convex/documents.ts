import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper function to check if user has access to a document (for queries)
 * Returns true if user is the owner OR has shared access
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

  // Check if user is the owner
  if (document.owner === userId) {
    return true;
  }

  // Check if document is shared with the user
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
 * Returns true if user is the owner OR has shared access
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

  // Check if user is the owner
  if (document.owner === userId) {
    return true;
  }

  // Check if document is shared with the user
  const share = await ctx.db
    .query("sharedDocuments")
    .withIndex("by_document_and_student", (q) =>
      q.eq("documentId", documentId).eq("studentId", userId),
    )
    .first();

  return share !== null;
}

/**
 * Create a new document
 */
export const createDocument = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const documentId = await ctx.db.insert("document", {
      owner: user._id,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

/**
 * Get all documents owned by the current user, ordered by most recently updated
 */
export const getMyDocuments = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documents = await ctx.db
      .query("document")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .collect();

    // Sort by updatedAt descending (most recent first)
    return documents.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a single document by ID
 */
export const getDocument = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, documentId, user._id);

    if (!hasAccess) {
      throw new Error("Not authorized to access this document");
    }

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
    if (!user) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId as Id<"document">);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to modify this document");
    }

    await ctx.db.patch(args.documentId as Id<"document">, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a document
 */
export const deleteDocument = mutation({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to delete this document");
    }

    await ctx.db.delete(args.documentId);
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
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccessMutation(
      ctx,
      documentId,
      user._id,
    );

    if (!hasAccess) {
      throw new Error("Not authorized to modify this document");
    }

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
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Check if user has access (owner or shared)
    const hasAccess = await hasDocumentAccess(ctx, documentId, user._id);

    if (!hasAccess) {
      throw new Error("Not authorized to access this document");
    }

    return document.content || null;
  },
});

/**
 * Share a document with students
 */
export const shareWithStudents = mutation({
  args: {
    documentId: v.string(),
    studentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to share this document");
    }

    const now = Date.now();

    // Share with each student
    for (const studentId of args.studentIds) {
      // Check if student is enrolled with this teacher
      const enrollment = await ctx.db
        .query("teacherStudents")
        .withIndex("by_teacher_and_student", (q) =>
          q.eq("teacherId", user._id).eq("studentId", studentId),
        )
        .first();

      if (!enrollment) {
        throw new Error(`Student ${studentId} is not enrolled with you`);
      }

      // Check if already shared
      const existingShare = await ctx.db
        .query("sharedDocuments")
        .withIndex("by_document_and_student", (q) =>
          q.eq("documentId", documentId).eq("studentId", studentId),
        )
        .first();

      if (!existingShare) {
        await ctx.db.insert("sharedDocuments", {
          documentId,
          teacherId: user._id,
          studentId,
          sharedAt: now,
        });
      }
    }
  },
});

/**
 * Get all documents shared with the current student
 */
export const getSharedDocuments = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get all shared documents for this student
    const shares = await ctx.db
      .query("sharedDocuments")
      .withIndex("by_student", (q) => q.eq("studentId", user._id))
      .collect();

    // Get document details and teacher info
    const documents = await Promise.all(
      shares.map(async (share) => {
        const document = await ctx.db.get(share.documentId);
        if (!document) {
          return null;
        }

        const teacherUser = await authComponent.getAnyUserById(
          ctx,
          share.teacherId,
        );

        return {
          ...document,
          teacherName: teacherUser?.name || "Unknown Teacher",
          sharedAt: share.sharedAt,
        };
      }),
    );

    // Filter out null values and sort by sharedAt descending
    return documents
      .filter((doc) => doc !== null)
      .sort((a, b) => b.sharedAt - a.sharedAt);
  },
});

/**
 * Get students who have access to a document
 */
export const getStudentsWithAccess = query({
  args: {
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const documentId = args.documentId as Id<"document">;
    const document = await ctx.db.get(documentId);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to view sharing details");
    }

    // Get all shares for this document
    const shares = await ctx.db
      .query("sharedDocuments")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    // Get student details
    const students = await Promise.all(
      shares.map(async (share) => {
        const studentUser = await authComponent.getAnyUserById(
          ctx,
          share.studentId,
        );

        return {
          studentId: share.studentId,
          displayName: studentUser?.name || share.studentId,
          sharedAt: share.sharedAt,
        };
      }),
    );

    return students;
  },
});

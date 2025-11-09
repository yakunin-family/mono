import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

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

    const document = await ctx.db.get(args.documentId as Id<"document">);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
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

    const document = await ctx.db.get(args.documentId as Id<"document">);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to modify this document");
    }

    await ctx.db.patch(args.documentId as Id<"document">, {
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

    const document = await ctx.db.get(args.documentId as Id<"document">);

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify ownership
    if (document.owner !== user._id) {
      throw new Error("Not authorized to access this document");
    }

    return document.content || null;
  },
});

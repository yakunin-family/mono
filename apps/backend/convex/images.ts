import { ConvexError, v } from "convex/values";

import { authedMutation, authedQuery } from "./functions";

// ============================================
// IMAGE UPLOAD CONSTANTS
// ============================================

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for image uploads */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// ============================================
// IMAGE UPLOAD FUNCTIONS
// ============================================

/**
 * Generate an upload URL for image files.
 * Client uses this URL to upload the image directly to Convex storage.
 * Returns the upload URL that the client can POST to.
 */
export const generateUploadUrl = authedMutation({
  args: {},
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

/**
 * Save an image after it has been uploaded.
 * Takes the storageId returned from the upload and persists it.
 * Returns the storageId for use in the editor.
 */
export const saveImage = authedMutation({
  args: {
    storageId: v.string(),
    filename: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate file size
    if (args.fileSize > MAX_FILE_SIZE) {
      throw new ConvexError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type (images only, no SVG)
    if (!ALLOWED_IMAGE_TYPES.has(args.mimeType)) {
      throw new ConvexError(
        `File type "${args.mimeType}" is not supported. Supported types: JPEG, PNG, GIF, WebP.`,
      );
    }

    // Return the storageId for use in the editor
    // The storageId is already persisted by Convex storage system
    return {
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
    };
  },
});

/**
 * Get a URL for an image given its storageId.
 * Resolves the storageId to a publicly accessible URL.
 */
export const getImageUrl = authedQuery({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new ConvexError("Image not found");
    }
    return { url };
  },
});

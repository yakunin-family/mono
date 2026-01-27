import { api } from "@app/backend";
import { useMutation } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { useCallback } from "react";

// ============================================
// CONSTANTS
// ============================================

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for image uploads */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ============================================
// TYPES
// ============================================

export interface UploadedImage {
  storageId: string;
  alt: string;
}

export interface UseImageUploadReturn {
  /** Upload an image file and return storage info */
  uploadImage: (file: File) => Promise<UploadedImage>;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
}

// ============================================
// HELPERS
// ============================================

function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `Image too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported image type: ${file.type}. Allowed types: JPEG, PNG, GIF, WebP.`;
  }

  return null;
}

// ============================================
// HOOK
// ============================================

export function useImageUpload(): UseImageUploadReturn {
  const convex = useConvex();

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadedImage> => {
      // 1. Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // 2. Generate upload URL
      const { uploadUrl } = await convex.mutation(
        api.images.generateUploadUrl,
        {},
      );

      // 3. Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image to storage");
      }

      const { storageId } = (await response.json()) as { storageId: string };

      // 4. Save image metadata to database
      await convex.mutation(api.images.saveImage, {
        storageId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      return {
        storageId,
        alt: file.name,
      };
    },
  });

  const uploadImage = useCallback(
    async (file: File): Promise<UploadedImage> => {
      return await uploadMutation.mutateAsync(file);
    },
    [uploadMutation],
  );

  return {
    uploadImage,
    isUploading: uploadMutation.isPending,
  };
}

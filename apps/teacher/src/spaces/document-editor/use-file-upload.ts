import { api } from "@app/backend";
import { useMutation } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { useCallback, useState } from "react";

// ============================================
// CONSTANTS
// ============================================

/** Maximum file size in bytes (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum number of files per message */
const MAX_FILES = 5;

/** Allowed MIME types for file uploads */
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Text
  "text/plain",
  "text/markdown",
  "text/csv",
  // Code
  "application/json",
  "application/xml",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
]);

// ============================================
// TYPES
// ============================================

export type UploadStatus = "pending" | "uploading" | "uploaded" | "error";

export interface AttachedFile {
  /** Local ID for tracking in UI */
  id: string;
  /** Original File object */
  file: File;
  /** Data URL for image previews */
  preview?: string;
  /** Current upload status */
  status: UploadStatus;
  /** Convex file ID after successful upload */
  fileId?: string;
  /** Error message if upload failed */
  error?: string;
}

export interface UploadedFile {
  fileId: string;
  filename: string;
  mimeType: string;
}

export interface UseFileUploadReturn {
  /** Currently attached files */
  attachedFiles: AttachedFile[];
  /** Add files from input or drag-drop */
  addFiles: (files: FileList | File[]) => void;
  /** Remove a file by local ID */
  removeFile: (id: string) => void;
  /** Upload all pending files and return uploaded file info */
  uploadAll: () => Promise<UploadedFile[]>;
  /** Clear all attached files */
  clearAll: () => void;
  /** Whether any files are currently uploading */
  isUploading: boolean;
  /** Whether more files can be attached */
  canAttachMore: boolean;
  /** Validation error message (if any) */
  validationError: string | null;
  /** Clear validation error */
  clearValidationError: () => void;
}

// ============================================
// HELPERS
// ============================================

function generateLocalId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

async function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type "${file.type || "unknown"}" is not supported.`;
  }

  return null;
}

// ============================================
// HOOK
// ============================================

export function useFileUpload(): UseFileUploadReturn {
  const convex = useConvex();
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isUploading = attachedFiles.some((f) => f.status === "uploading");
  const canAttachMore = attachedFiles.length < MAX_FILES;

  // Upload mutation for a single file
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const bytes = await file.arrayBuffer();
      return await convex.action(api.chat.uploadChatFile, {
        bytes,
        filename: file.name,
        mimeType: file.type,
      });
    },
  });

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      setValidationError(null);

      // Check if adding these files would exceed the limit
      const availableSlots = MAX_FILES - attachedFiles.length;
      if (fileArray.length > availableSlots) {
        setValidationError(
          `Cannot add ${fileArray.length} files. Only ${availableSlots} slot${availableSlots === 1 ? "" : "s"} available (max ${MAX_FILES}).`,
        );
        return;
      }

      // Validate all files first
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          setValidationError(error);
          return;
        }
      }

      // Create AttachedFile entries with previews
      const newFiles: AttachedFile[] = await Promise.all(
        fileArray.map(async (file) => {
          const preview = isImageFile(file)
            ? await createImagePreview(file)
            : undefined;

          return {
            id: generateLocalId(),
            file,
            preview,
            status: "pending" as const,
          };
        }),
      );

      setAttachedFiles((prev) => [...prev, ...newFiles]);

      // Start uploading immediately
      for (const attachedFile of newFiles) {
        // Mark as uploading
        setAttachedFiles((prev) =>
          prev.map((f) =>
            f.id === attachedFile.id ? { ...f, status: "uploading" } : f,
          ),
        );

        try {
          const result = await uploadMutation.mutateAsync(attachedFile.file);

          // Mark as uploaded with fileId
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.id === attachedFile.id
                ? { ...f, status: "uploaded", fileId: result.fileId }
                : f,
            ),
          );
        } catch (err) {
          // Mark as error
          const errorMessage =
            err instanceof Error ? err.message : "Upload failed";
          setAttachedFiles((prev) =>
            prev.map((f) =>
              f.id === attachedFile.id
                ? { ...f, status: "error", error: errorMessage }
                : f,
            ),
          );
        }
      }
    },
    [attachedFiles.length, uploadMutation],
  );

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAttachedFiles([]);
    setValidationError(null);
  }, []);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const uploadAll = useCallback(async (): Promise<UploadedFile[]> => {
    // Return only successfully uploaded files
    return attachedFiles
      .filter(
        (f): f is AttachedFile & { fileId: string } =>
          f.status === "uploaded" && !!f.fileId,
      )
      .map((f) => ({
        fileId: f.fileId,
        filename: f.file.name,
        mimeType: f.file.type,
      }));
  }, [attachedFiles]);

  return {
    attachedFiles,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    isUploading,
    canAttachMore,
    validationError,
    clearValidationError,
  };
}

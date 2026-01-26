import { Button, cn } from "@package/ui";
import { FileIcon, Loader2Icon, XIcon, AlertCircleIcon } from "lucide-react";

import type { AttachedFile, UploadStatus } from "./use-file-upload";

interface FilePreviewStripProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

export function FilePreviewStrip({ files, onRemove }: FilePreviewStripProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {files.map((file) => (
        <FilePreviewItem key={file.id} file={file} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface FilePreviewItemProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

function FilePreviewItem({ file, onRemove }: FilePreviewItemProps) {
  const isImage = file.file.type.startsWith("image/");
  const hasError = file.status === "error";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg border bg-muted/50 p-2 pr-8",
        hasError && "border-destructive bg-destructive/10",
      )}
    >
      {/* Preview or icon */}
      {isImage && file.preview ? (
        <img
          src={file.preview}
          alt={file.file.name}
          className="size-10 rounded object-cover"
        />
      ) : (
        <div className="flex size-10 items-center justify-center rounded bg-muted">
          <FileIcon className="size-5 text-muted-foreground" />
        </div>
      )}

      {/* File info */}
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="truncate text-sm font-medium max-w-[120px]">
          {file.file.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.file.size)}
        </span>
      </div>

      {/* Status indicator */}
      <StatusIndicator status={file.status} error={file.error} />

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 size-5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.file.name}`}
      >
        <XIcon className="size-3" />
      </Button>
    </div>
  );
}

interface StatusIndicatorProps {
  status: UploadStatus;
  error?: string;
}

function StatusIndicator({ status, error }: StatusIndicatorProps) {
  if (status === "uploading" || status === "pending") {
    return (
      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1" title={error}>
        <AlertCircleIcon className="size-4 text-destructive" />
      </div>
    );
  }

  // Uploaded successfully - no indicator needed
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

import { Button, Card, cn, Textarea } from "@package/ui";
import { ArrowUpIcon, PaperclipIcon, SquareIcon } from "lucide-react";
import {
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import { FilePreviewStrip } from "./file-preview-strip";
import { useFileUpload, type UploadedFile } from "./use-file-upload";

interface ChatInputProps {
  onSend: (message: string, attachments?: UploadedFile[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onCancel,
  isLoading = false,
  placeholder = "Ask AI to edit your document...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUpload = useFileUpload();

  // Can send if there's text OR successfully uploaded files (and not loading)
  const hasUploadedFiles = fileUpload.attachedFiles.some(
    (f) => f.status === "uploaded",
  );
  const canSend =
    (value.trim().length > 0 || hasUploadedFiles) &&
    !isLoading &&
    !fileUpload.isUploading;

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    // Get successfully uploaded files
    const attachments = await fileUpload.uploadAll();

    onSend(value.trim(), attachments.length > 0 ? attachments : undefined);
    setValue("");
    fileUpload.clearAll();
    textareaRef.current?.focus();
  }, [canSend, value, fileUpload, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      fileUpload.addFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  };

  // Handle drag events
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      fileUpload.addFiles(files);
    }
  };

  // Handle paste for images
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      fileUpload.addFiles(files);
    }
  };

  return (
    <div className="shrink-0 p-4">
      {/* Cancel button - appears above input when AI is generating */}
      {isLoading && onCancel && (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <SquareIcon className="size-3 fill-current" />
            Stop generating
          </Button>
        </div>
      )}

      <Card
        className={cn(
          "flex flex-col gap-2 p-3 transition-colors",
          isDragging && "ring-2 ring-primary ring-offset-2",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File previews */}
        <FilePreviewStrip
          files={fileUpload.attachedFiles}
          onRemove={fileUpload.removeFile}
        />

        {/* Validation error */}
        {fileUpload.validationError && (
          <div className="px-3 py-1 text-xs text-destructive">
            {fileUpload.validationError}
          </div>
        )}

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isDragging ? "Drop files here..." : placeholder}
          disabled={isLoading}
          className="min-h-0 max-h-48 resize-none overflow-y-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0"
          rows={1}
        />

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Attachment button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!fileUpload.canAttachMore || isLoading}
              aria-label="Attach files"
              title={
                fileUpload.canAttachMore
                  ? "Attach files (max 5)"
                  : "Maximum files reached"
              }
            >
              <PaperclipIcon className="size-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.xml,.html,.css,.js"
            />

            {/* File count indicator */}
            {fileUpload.attachedFiles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {fileUpload.attachedFiles.length}/5 files
              </span>
            )}
          </div>

          {/* Send button */}
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "rounded-full transition-colors",
              canSend
                ? "bg-foreground text-background hover:bg-foreground/80"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

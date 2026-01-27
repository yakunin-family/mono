# Complete Code Examples - File Upload & Toolbar Integration

## COMPLETE FILE: use-file-upload.ts

```typescript
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
```

---

## COMPLETE FILE: toolbar-button.tsx

```typescript
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@package/ui";
import type { ComponentType } from "react";

interface ToolbarButtonProps {
  icon: ComponentType<{ className?: string }>;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ToolbarButton({
  icon: Icon,
  tooltip,
  isActive,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClick}
            disabled={disabled}
            className={cn(isActive && "bg-muted text-foreground")}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
```

---

## COMPLETE FILE: editor-toolbar.tsx

```typescript
import { Separator } from "@package/ui";
import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react";
import { useEffect, useReducer } from "react";
import { ToolbarButton } from "./toolbar-button";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const updateHandler = () => forceUpdate();

    editor.on("selectionUpdate", updateHandler);
    editor.on("transaction", updateHandler);

    return () => {
      editor.off("selectionUpdate", updateHandler);
      editor.off("transaction", updateHandler);
    };
  }, [editor]);

  return (
    <div className="z-40 flex shrink-0 flex-wrap items-center gap-0.5 border-b bg-background px-2 py-1">
      {/* Text Formatting Group */}
      <ToolbarButton
        icon={BoldIcon}
        tooltip="Bold (Ctrl+B)"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={ItalicIcon}
        tooltip="Italic (Ctrl+I)"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        tooltip="Underline (Ctrl+U)"
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings Group */}
      <ToolbarButton
        icon={Heading1Icon}
        tooltip="Heading 1"
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2Icon}
        tooltip="Heading 2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3Icon}
        tooltip="Heading 3"
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists Group */}
      <ToolbarButton
        icon={ListIcon}
        tooltip="Bullet List"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrderedIcon}
        tooltip="Numbered List"
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}
```

---

## COMPLETE FILE: SlashCommand.tsx (Excerpt - Mode Filtering)

```typescript
import { Editor, Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { computePosition } from "@floating-ui/dom";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table,
  Image,
  Code,
  FileText,
  FormInput,
  NotebookPen,
  Library,
} from "lucide-react";
import {
  SlashCommandMenu,
  type SlashCommandMenuRef,
} from "../components/SlashCommandMenu";
import type {} from "@tiptap/extension-table";
import type {} from "@tiptap/extension-image";
import type { Range } from "@tiptap/core";
import type {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";

export interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      canEdit: true,
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: CommandItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.canEdit) {
      return [];
    }

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({
          query,
          editor,
        }: {
          query: string;
          editor: Editor;
        }): CommandItem[] => {
          const items: CommandItem[] = [
            {
              title: "Heading 1",
              icon: Heading1,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 1 })
                  .run();
              },
            },
            {
              title: "Heading 2",
              icon: Heading2,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 2 })
                  .run();
              },
            },
            {
              title: "Heading 3",
              icon: Heading3,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 3 })
                  .run();
              },
            },
            {
              title: "Bullet List",
              icon: List,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBulletList()
                  .run();
              },
            },
            {
              title: "Numbered List",
              icon: ListOrdered,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleOrderedList()
                  .run();
              },
            },
            {
              title: "Blockquote",
              icon: Quote,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBlockquote()
                  .run();
              },
            },
            {
              title: "Table",
              icon: Table,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              },
            },
            {
              title: "Image",
              icon: Image,
              command: ({ editor, range }) => {
                const url = prompt("Enter image URL:");
                if (url) {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setImage({ src: url })
                    .run();
                }
              },
            },
            {
              title: "Exercise",
              icon: FileText,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertExercise()
                  .run();
              },
            },
          ];

          // MODE-BASED FILTERING: Only add teacher-specific commands
          const editorMode = editor.storage.editorMode;
          if (editorMode === "teacher-editor") {
            items.push(
              {
                title: "Blank",
                icon: FormInput,
                command: ({ editor, range }) => {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent({
                      type: "blank",
                    })
                    .run();
                },
              },
              {
                title: "Writing Area",
                icon: NotebookPen,
                command: ({ editor, range }) => {
                  const id = `writing-area-${Date.now()}`;
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .insertContent({
                      type: "writingArea",
                      attrs: {
                        id,
                        lines: 5,
                        placeholder: "Write your answer here...",
                      },
                      content: [
                        {
                          type: "paragraph",
                        },
                      ],
                    })
                    .run();
                },
              },
              {
                title: "Library",
                icon: Library,
                command: ({ editor, range }) => {
                  editor.chain().focus().deleteRange(range).run();
                  window.dispatchEvent(new CustomEvent("openLibraryModal"));
                },
              },
            );
          }

          return items.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()),
          );
        },
        render: () => {
          let component: ReactRenderer<SlashCommandMenuRef>;
          let popup: HTMLElement;

          return {
            onStart: (props: SuggestionProps<CommandItem>) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              popup = component.element;
              popup.style.position = "absolute";
              popup.style.top = "0";
              popup.style.left = "0";
              popup.style.zIndex = "50";

              document.body.appendChild(popup);

              if (!props.clientRect) {
                return;
              }

              // Position the menu using floating-ui
              const rect = props.clientRect();
              if (rect) {
                computePosition(
                  {
                    getBoundingClientRect: () => rect,
                  },
                  popup,
                  {
                    placement: "bottom-start",
                  },
                ).then(({ x, y }) => {
                  popup.style.transform = `translate(${x}px, ${y}px)`;
                });
              }
            },
            onUpdate(props: SuggestionProps<CommandItem>) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              // Update position
              const rect = props.clientRect();
              if (rect) {
                computePosition(
                  {
                    getBoundingClientRect: () => rect,
                  },
                  popup,
                  {
                    placement: "bottom-start",
                  },
                ).then(({ x, y }) => {
                  popup.style.transform = `translate(${x}px, ${y}px)`;
                });
              }
            },
            onKeyDown(props: SuggestionKeyDownProps) {
              if (props.event.key === "Escape") {
                return true;
              }

              return component.ref?.onKeyDown?.(props);
            },
            onExit() {
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
```

---

## COMPLETE FILE: BlankView.tsx

```typescript
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { BlankAttributes } from "./Blank";
import { StudentBlankInput } from "@/components/blank/StudentBlankInput";
import { TeacherLessonBlank } from "@/components/blank/TeacherLessonBlank";
import { TeacherEditorBadge } from "@/components/blank/TeacherEditorBadge";
import { validateAnswer } from "@/utils/blankValidation";
import { useEditorMode } from "@/components/DocumentEditor";

interface BlankNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: BlankAttributes };
}

export function BlankView(props: NodeViewProps) {
  const { node, updateAttributes } = props as BlankNodeViewProps;

  const mode = useEditorMode();
  const { studentAnswer, hint, correctAnswer, alternativeAnswers } = node.attrs;

  const isCorrect = validateAnswer(
    studentAnswer,
    correctAnswer,
    alternativeAnswers,
  );

  return (
    <NodeViewWrapper as="span" className="inline-block">
      {mode === "student" && (
        <StudentBlankInput
          value={studentAnswer}
          onChange={(val) => updateAttributes({ studentAnswer: val })}
          hint={hint}
        />
      )}

      {mode === "teacher-lesson" && (
        <TeacherLessonBlank
          studentAnswer={studentAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          hint={hint}
        />
      )}

      {mode === "teacher-editor" && (
        <TeacherEditorBadge
          correctAnswer={correctAnswer}
          alternativeAnswers={alternativeAnswers}
          hint={hint}
          onEdit={(newAnswer) => updateAttributes({ correctAnswer: newAnswer })}
        />
      )}
    </NodeViewWrapper>
  );
}
```

---

## COMPLETE FILE: SelectionSaveButton.tsx

```typescript
import { Button } from "@package/ui";
import type { Editor } from "@tiptap/core";
import { GroupIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SelectionSaveButtonProps {
  editor: Editor;
}

interface SelectionState {
  hasMultiBlockSelection: boolean;
  selectionCoords: { top: number; left: number } | null;
}

export function SelectionSaveButton({ editor }: SelectionSaveButtonProps) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    hasMultiBlockSelection: false,
    selectionCoords: null,
  });

  useEffect(() => {
    const handleSelectionUpdate = (event: CustomEvent<SelectionState>) => {
      setSelectionState(event.detail);
    };

    window.addEventListener(
      "selectionSaveUpdate",
      handleSelectionUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "selectionSaveUpdate",
        handleSelectionUpdate as EventListener,
      );
    };
  }, []);

  const handleGroup = useCallback(() => {
    editor.chain().focus().wrapInGroup().run();
  }, [editor]);

  const editorMode = editor.storage.editorMode;
  const isTeacherEditor = editorMode === "teacher-editor";

  if (!isTeacherEditor) {
    return null;
  }

  const { hasMultiBlockSelection, selectionCoords } = selectionState;

  if (!hasMultiBlockSelection || !selectionCoords) {
    return null;
  }

  const buttonStyle: React.CSSProperties = {
    position: "fixed",
    top: selectionCoords.top - 40,
    left: selectionCoords.left,
    zIndex: 50,
  };

  return createPortal(
    <div style={buttonStyle}>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleGroup}
        className="shadow-md"
      >
        <GroupIcon className="mr-1.5 h-4 w-4" />
        Group
      </Button>
    </div>,
    document.body,
  );
}
```

---

## COMPLETE FILE: DocumentEditorInternal.tsx (Excerpt - Key Sections)

```typescript
// Storage Declaration
declare module "@tiptap/core" {
  interface Storage {
    library: LibraryStorage;
  }
}

export interface LibraryStorage {
  saveExercise?: (title: string, content: string) => Promise<void>;
}

// Component
export function DocumentEditorInternal({
  provider,
  ydoc,
  canEdit,
  mode,
  status,
  documentId,
  spaceId,
  convexClient,
  onSaveExerciseToBank,
  onSaveGroupToLibrary,
  libraryItems = [],
  isLoadingLibraryItems = false,
  onEditorReady,
}: DocumentEditorInternalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      // ... other extensions ...
      SlashCommand.configure({
        canEdit,
      }),
      // ... more extensions ...
    ],
    editable: canEdit,
    immediatelyRender: false,
  });

  // Update editability when canEdit prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  // Store mode in editor storage for backward compatibility
  useEffect(() => {
    if (editor) {
      editor.storage.editorMode = mode;
    }
  }, [editor, mode]);

  // Set library save callback in editor storage
  useEffect(() => {
    if (editor) {
      editor.storage.library = {
        saveExercise: onSaveExerciseToBank,
      };
    }
  }, [editor, onSaveExerciseToBank]);

  // Listen for openLibraryModal custom event
  useEffect(() => {
    const handleOpenLibraryModal = () => setLibraryModalOpen(true);
    window.addEventListener("openLibraryModal", handleOpenLibraryModal);
    return () =>
      window.removeEventListener("openLibraryModal", handleOpenLibraryModal);
  }, []);

  if (!editor) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Initializing editor...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col">
      {canEdit && <EditorToolbar editor={editor} />}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="[&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none [&_.tiptap]:py-8"
        />
      </div>

      <MouseTracker provider={provider} containerRef={containerRef} />
      <RemoteCursors provider={provider} />

      <EditorStatusBar status={status} editor={editor} />

      <LibraryDrawer
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        items={libraryItems}
        isLoading={isLoadingLibraryItems}
        onInsert={handleInsertFromLibrary}
      />

      <SelectionSaveButton editor={editor} />
      <MarqueeOverlay editor={editor} />
    </div>
  );
}
```


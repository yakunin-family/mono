# File Upload UI and Toolbar Integration Patterns

## 1. File Upload Hook Pattern (`use-file-upload.ts`)

### Hook Structure
```typescript
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
  // ... rest of implementation
}
```

### Key Features
- **State Management**: Tracks `attachedFiles` array with individual file status
- **Validation**: Pre-validates all files before adding to state
- **Async Upload**: Uses TanStack Query `useMutation` for individual file uploads
- **Status Tracking**: Each file has `status: "pending" | "uploading" | "uploaded" | "error"`
- **Preview Generation**: Creates data URLs for image files automatically

### File Validation Pattern
```typescript
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type "${file.type || "unknown"}" is not supported.`;
  }

  return null;
}
```

### Upload Flow
1. User adds files via `addFiles(files: FileList | File[])`
2. Validate all files first (fail fast)
3. Create `AttachedFile` entries with previews
4. Add to state as "pending"
5. Immediately start uploading each file sequentially
6. Update status to "uploading" → "uploaded" or "error"
7. Return successfully uploaded files via `uploadAll()`

### Constants
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ALLOWED_MIME_TYPES = new Set([
  // Images: jpeg, png, gif, webp, svg+xml
  // Documents: pdf, doc, docx, xls, xlsx, ppt, pptx
  // Text: plain, markdown, csv
  // Code: json, xml, html, css, javascript
]);
```

---

## 2. Toolbar Button Pattern (`toolbar-button.tsx`)

### Component Structure
```typescript
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

### Key Patterns
- **Icon Composition**: Accepts icon component as prop (from lucide-react)
- **Active State**: Conditional styling with `cn()` utility
- **Tooltip Integration**: Wraps button with shadcn Tooltip
- **Accessibility**: Tooltips provide keyboard hints (e.g., "Bold (Ctrl+B)")

---

## 3. Editor Toolbar Implementation (`editor-toolbar.tsx`)

### Conditional Rendering by Mode
```typescript
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
      {/* ... more buttons ... */}
      <Separator orientation="vertical" className="mx-1 h-6" />
      {/* Headings Group */}
      {/* ... */}
    </div>
  );
}
```

### Key Patterns
- **Force Update on Selection**: Uses `useReducer` to trigger re-renders on editor changes
- **Event Listeners**: Listens to `selectionUpdate` and `transaction` events
- **Active State Detection**: Uses `editor.isActive()` to determine button state
- **Grouped Buttons**: Uses `Separator` component to visually group related buttons
- **Conditional Rendering**: Toolbar only renders when `canEdit={true}` in DocumentEditorInternal

### Toolbar Rendering in DocumentEditorInternal
```typescript
return (
  <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col">
    {canEdit && <EditorToolbar editor={editor} />}
    {/* ... rest of editor ... */}
  </div>
);
```

---

## 4. Slash Command Mode Filtering (`SlashCommand.tsx`)

### Extension Configuration
```typescript
export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      canEdit: true,
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.canEdit) {
      return [];
    }
    // ... rest of plugin
  },
});
```

### Mode-Based Command Filtering
```typescript
items: ({ query, editor }): CommandItem[] => {
  const items: CommandItem[] = [
    // Always available commands
    { title: "Heading 1", icon: Heading1, command: ... },
    { title: "Heading 2", icon: Heading2, command: ... },
    // ... more common commands ...
  ];

  const editorMode = editor.storage.editorMode;
  if (editorMode === "teacher-editor") {
    items.push(
      {
        title: "Blank",
        icon: FormInput,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: "blank",
          }).run();
        },
      },
      {
        title: "Writing Area",
        icon: NotebookPen,
        command: ({ editor, range }) => {
          const id = `writing-area-${Date.now()}`;
          editor.chain().focus().deleteRange(range).insertContent({
            type: "writingArea",
            attrs: { id, lines: 5, placeholder: "Write your answer here..." },
            content: [{ type: "paragraph" }],
          }).run();
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
```

### Key Patterns
- **Mode Storage**: Reads `editor.storage.editorMode` to determine available commands
- **Conditional Push**: Only adds teacher-specific commands when `editorMode === "teacher-editor"`
- **Custom Events**: Uses `window.dispatchEvent()` for cross-component communication (e.g., opening library modal)
- **Query Filtering**: Filters commands by user input after mode-based filtering

---

## 5. Mode-Based Component Rendering

### BlankView Pattern
```typescript
export function BlankView(props: NodeViewProps) {
  const { node, updateAttributes } = props as BlankNodeViewProps;
  const mode = useEditorMode();
  const { studentAnswer, hint, correctAnswer, alternativeAnswers } = node.attrs;

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

### ExerciseView Pattern
```typescript
const mode = editor.storage.editorMode as EditorMode | undefined;
const isStudentMode = mode === "student";
const isTeacherMode = mode === "teacher-editor" || mode === "teacher-lesson";

// Later in render:
{isTeacherMode && (
  <Button onClick={handleSaveToBank}>
    <BookmarkPlusIcon className="mr-2 h-4 w-4" />
    Save to Bank
  </Button>
)}
```

### SelectionSaveButton Pattern
```typescript
export function SelectionSaveButton({ editor }: SelectionSaveButtonProps) {
  const editorMode = editor.storage.editorMode;
  const isTeacherEditor = editorMode === "teacher-editor";

  if (!isTeacherEditor) {
    return null;
  }

  // Only render for teacher-editor mode
  return createPortal(
    <div style={buttonStyle}>
      <Button size="sm" variant="secondary" onClick={handleGroup}>
        <GroupIcon className="mr-1.5 h-4 w-4" />
        Group
      </Button>
    </div>,
    document.body,
  );
}
```

---

## 6. Loading State Patterns

### File Upload Loading State
```typescript
const isUploading = attachedFiles.some((f) => f.status === "uploading");
const canAttachMore = attachedFiles.length < MAX_FILES;

// In UI:
<Button disabled={isUploading || !canAttachMore}>
  Add Files
</Button>
```

### Editor Toolbar Update Pattern
```typescript
useEffect(() => {
  const updateHandler = () => forceUpdate();
  editor.on("selectionUpdate", updateHandler);
  editor.on("transaction", updateHandler);
  return () => {
    editor.off("selectionUpdate", updateHandler);
    editor.off("transaction", updateHandler);
  };
}, [editor]);
```

### Modal Loading State
```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSave = async (title: string) => {
  setIsSaving(true);
  try {
    await editor.storage.library.saveExercise?.(title, content);
  } finally {
    setIsSaving(false);
  }
};

// In UI:
<Button onClick={handleSave} disabled={!title.trim() || isSaving}>
  {isSaving ? "Saving..." : "Save"}
</Button>
```

---

## 7. Editor Storage Pattern

### Storage Declaration
```typescript
declare module "@tiptap/core" {
  interface Storage {
    editorMode: EditorMode;
    library: LibraryStorage;
    documentContext?: DocumentContext;
    groupSave?: GroupSaveStorage;
  }
}
```

### Storage Initialization
```typescript
// In DocumentEditorInternal
useEffect(() => {
  if (editor) {
    editor.storage.editorMode = mode;
  }
}, [editor, mode]);

useEffect(() => {
  if (editor) {
    editor.storage.library = {
      saveExercise: onSaveExerciseToBank,
    };
  }
}, [editor, onSaveExerciseToBank]);
```

### Storage Access
```typescript
// In components/extensions
const mode = editor.storage.editorMode as EditorMode | undefined;
const saveExercise = editor.storage.library?.saveExercise;
const documentId = editor.storage.documentContext?.documentId;
```

---

## 8. File Picker Dialog Pattern

### Custom Event Pattern
```typescript
// In SlashCommand - trigger library modal
window.dispatchEvent(new CustomEvent("openLibraryModal"));

// In DocumentEditorInternal - listen for event
useEffect(() => {
  const handleOpenLibraryModal = () => setLibraryModalOpen(true);
  window.addEventListener("openLibraryModal", handleOpenLibraryModal);
  return () =>
    window.removeEventListener("openLibraryModal", handleOpenLibraryModal);
}, []);
```

### Modal State Management
```typescript
const [libraryModalOpen, setLibraryModalOpen] = useState(false);

// Render modal
<LibraryDrawer
  open={libraryModalOpen}
  onOpenChange={setLibraryModalOpen}
  items={libraryItems}
  isLoading={isLoadingLibraryItems}
  onInsert={handleInsertFromLibrary}
/>
```

---

## 9. Editor Mode Types

```typescript
type EditorMode = "student" | "teacher-lesson" | "teacher-editor";

// Usage:
- "student": Read-only or limited editing (can fill blanks, write answers)
- "teacher-lesson": Teacher viewing student work (can see answers, mark homework)
- "teacher-editor": Teacher creating/editing content (full access to all tools)
```

---

## 10. Integration Points

### DocumentEditor → DocumentEditorInternal
- Initializes HocuspocusProvider and Y.Doc
- Wraps with Convex and Query providers
- Passes `canEdit` and `mode` props

### DocumentEditorInternal → Extensions
- Configures SlashCommand with `canEdit` option
- Stores `editorMode` in editor.storage
- Stores callbacks in editor.storage (library, groupSave)

### Extensions → Components
- SlashCommand filters commands by mode
- BlankView/ExerciseView read mode from storage
- SelectionSaveButton checks mode before rendering

### Toolbar → Editor
- Listens to editor events (selectionUpdate, transaction)
- Uses `editor.isActive()` to determine button state
- Conditionally renders based on `canEdit` prop

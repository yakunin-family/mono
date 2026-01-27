# File Upload UI & Toolbar Integration - Summary

## Quick Reference

### Files Analyzed
1. `/apps/teacher/src/spaces/document-editor/use-file-upload.ts` - File upload hook
2. `/packages/editor/src/components/editor-toolbar.tsx` - Toolbar component
3. `/packages/editor/src/components/toolbar-button.tsx` - Reusable button component
4. `/packages/editor/src/extensions/SlashCommand.tsx` - Slash command extension with mode filtering
5. `/packages/editor/src/extensions/BlankView.tsx` - Mode-based component rendering
6. `/packages/editor/src/components/SelectionSaveButton.tsx` - Mode-gated UI element
7. `/packages/editor/src/components/DocumentEditorInternal.tsx` - Editor initialization & storage setup

---

## Key Architectural Patterns

### 1. File Upload Hook Pattern
**Location**: `use-file-upload.ts`

**Purpose**: Manages file selection, validation, preview generation, and upload state

**Key Features**:
- Validates files before adding to state (fail-fast pattern)
- Tracks individual file status: `pending → uploading → uploaded/error`
- Generates image previews automatically
- Uses TanStack Query `useMutation` for async uploads
- Enforces limits: 10MB per file, 5 files max

**Return Interface**:
```typescript
{
  attachedFiles: AttachedFile[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  uploadAll: () => Promise<UploadedFile[]>;
  clearAll: () => void;
  isUploading: boolean;
  canAttachMore: boolean;
  validationError: string | null;
  clearValidationError: () => void;
}
```

---

### 2. Toolbar Button Component Pattern
**Location**: `toolbar-button.tsx`

**Purpose**: Reusable button component with icon, tooltip, and active state

**Key Features**:
- Accepts icon component as prop (composition over inheritance)
- Conditional styling for active state using `cn()` utility
- Integrated tooltip with keyboard hints
- Ghost variant for minimal visual weight

**Props**:
```typescript
{
  icon: ComponentType<{ className?: string }>;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}
```

---

### 3. Editor Toolbar Implementation
**Location**: `editor-toolbar.tsx`

**Purpose**: Renders formatting buttons grouped by category

**Key Features**:
- Uses `useReducer` to force re-renders on editor state changes
- Listens to `selectionUpdate` and `transaction` events
- Uses `editor.isActive()` to determine button state
- Groups buttons with `Separator` components
- Conditionally renders based on `canEdit` prop

**Conditional Rendering**:
```typescript
{canEdit && <EditorToolbar editor={editor} />}
```

---

### 4. Mode-Based Command Filtering
**Location**: `SlashCommand.tsx`

**Purpose**: Filters slash commands based on editor mode

**Three Editor Modes**:
- `"student"`: Limited editing (fill blanks, write answers)
- `"teacher-lesson"`: View student work (see answers, mark homework)
- `"teacher-editor"`: Full editing (all tools available)

**Mode-Specific Commands**:
- Always available: Headings, Lists, Blockquote, Table, Image, Exercise
- Teacher-only: Blank, Writing Area, Library

**Implementation**:
```typescript
const editorMode = editor.storage.editorMode;
if (editorMode === "teacher-editor") {
  items.push(
    { title: "Blank", ... },
    { title: "Writing Area", ... },
    { title: "Library", ... },
  );
}
```

---

### 5. Mode-Based Component Rendering
**Location**: `BlankView.tsx`, `SelectionSaveButton.tsx`

**Pattern**: Render different UI based on `editor.storage.editorMode`

**BlankView Example**:
```typescript
{mode === "student" && <StudentBlankInput ... />}
{mode === "teacher-lesson" && <TeacherLessonBlank ... />}
{mode === "teacher-editor" && <TeacherEditorBadge ... />}
```

**SelectionSaveButton Example**:
```typescript
const isTeacherEditor = editorMode === "teacher-editor";
if (!isTeacherEditor) return null;
// Only render for teacher-editor mode
```

---

### 6. Editor Storage Pattern
**Location**: `DocumentEditorInternal.tsx`

**Purpose**: Share data between extensions and components without prop drilling

**Storage Declaration**:
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

**Initialization**:
```typescript
useEffect(() => {
  if (editor) {
    editor.storage.editorMode = mode;
    editor.storage.library = { saveExercise: onSaveExerciseToBank };
  }
}, [editor, mode, onSaveExerciseToBank]);
```

**Access**:
```typescript
const mode = editor.storage.editorMode;
const saveExercise = editor.storage.library?.saveExercise;
```

---

### 7. Custom Event Pattern
**Location**: `SlashCommand.tsx` (dispatch), `DocumentEditorInternal.tsx` (listen)

**Purpose**: Cross-component communication without prop drilling

**Dispatch**:
```typescript
window.dispatchEvent(new CustomEvent("openLibraryModal"));
```

**Listen**:
```typescript
useEffect(() => {
  const handleOpenLibraryModal = () => setLibraryModalOpen(true);
  window.addEventListener("openLibraryModal", handleOpenLibraryModal);
  return () => window.removeEventListener("openLibraryModal", handleOpenLibraryModal);
}, []);
```

---

### 8. Loading State Patterns

**File Upload**:
```typescript
const isUploading = attachedFiles.some((f) => f.status === "uploading");
<Button disabled={isUploading || !canAttachMore}>Add Files</Button>
```

**Toolbar Updates**:
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

**Modal Saving**:
```typescript
const [isSaving, setIsSaving] = useState(false);
<Button disabled={!title.trim() || isSaving}>
  {isSaving ? "Saving..." : "Save"}
</Button>
```

---

## Integration Flow

```
DocumentEditor (initialization)
  ↓
DocumentEditorInternal (setup storage & extensions)
  ├─ SlashCommand.configure({ canEdit })
  ├─ editor.storage.editorMode = mode
  ├─ editor.storage.library = callbacks
  └─ Listen for custom events
    ↓
Extensions & Components (read from storage)
  ├─ SlashCommand: Filter commands by mode
  ├─ BlankView: Render by mode
  ├─ SelectionSaveButton: Check mode before rendering
  └─ ExerciseView: Show mode-specific buttons
    ↓
Toolbar (conditional rendering)
  └─ {canEdit && <EditorToolbar editor={editor} />}
```

---

## Best Practices Observed

1. **Fail-Fast Validation**: Validate all files before adding to state
2. **Composition Over Inheritance**: Icon components passed as props
3. **Event-Driven Updates**: Use editor events to trigger re-renders
4. **Storage for Cross-Component Data**: Avoid prop drilling with editor.storage
5. **Custom Events for Modals**: Decouple slash command from library modal
6. **Mode-Based Rendering**: Use ternary operators for mode-specific UI
7. **Type Safety**: Module augmentation for editor.storage
8. **Cleanup**: Always remove event listeners in useEffect cleanup
9. **Conditional Rendering**: Check mode before rendering expensive components
10. **Status Tracking**: Track individual file status for granular UI updates

---

## Common Patterns to Reuse

### Pattern 1: Mode-Based Conditional Rendering
```typescript
const mode = useEditorMode(); // or editor.storage.editorMode
{mode === "teacher-editor" && <TeacherOnlyComponent />}
```

### Pattern 2: File Upload with Validation
```typescript
const { addFiles, attachedFiles, isUploading } = useFileUpload();
// Validate before adding
// Track status
// Show previews
```

### Pattern 3: Toolbar Button
```typescript
<ToolbarButton
  icon={IconComponent}
  tooltip="Action (Ctrl+K)"
  isActive={editor.isActive("format")}
  onClick={() => editor.chain().focus().toggleFormat().run()}
/>
```

### Pattern 4: Editor Storage Access
```typescript
declare module "@tiptap/core" {
  interface Storage {
    myData: MyDataType;
  }
}
// Later: editor.storage.myData
```

### Pattern 5: Custom Event Communication
```typescript
// Dispatch
window.dispatchEvent(new CustomEvent("eventName", { detail: data }));

// Listen
useEffect(() => {
  const handler = (e: CustomEvent) => { /* handle */ };
  window.addEventListener("eventName", handler as EventListener);
  return () => window.removeEventListener("eventName", handler as EventListener);
}, []);
```


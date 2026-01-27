# Files Analyzed - Complete List

## Primary Files

### 1. File Upload Hook
**Path**: `/Users/nikita.yakunin/personal/mono/apps/teacher/src/spaces/document-editor/use-file-upload.ts`
**Lines**: 267
**Purpose**: Custom React hook for managing file uploads with validation, preview generation, and status tracking
**Key Exports**:
- `useFileUpload()` - Main hook
- `AttachedFile` - File state interface
- `UploadedFile` - Uploaded file info
- `UploadStatus` - Status type

---

### 2. Toolbar Button Component
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/components/toolbar-button.tsx`
**Lines**: 44
**Purpose**: Reusable button component with icon, tooltip, and active state
**Key Exports**:
- `ToolbarButton` - Component
- `ToolbarButtonProps` - Props interface

---

### 3. Editor Toolbar
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/components/editor-toolbar.tsx`
**Lines**: 97
**Purpose**: Main toolbar component that renders formatting buttons
**Key Exports**:
- `EditorToolbar` - Component
- `EditorToolbarProps` - Props interface

---

### 4. Slash Command Extension
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/extensions/SlashCommand.tsx`
**Lines**: 330
**Purpose**: Tiptap extension for slash command menu with mode-based filtering
**Key Exports**:
- `SlashCommand` - Extension
- `CommandItem` - Command interface

---

### 5. Blank Node View
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/extensions/BlankView.tsx`
**Lines**: 56
**Purpose**: React component for rendering blank nodes with mode-based UI
**Key Exports**:
- `BlankView` - Component
- `BlankNodeViewProps` - Props interface

---

### 6. Selection Save Button
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/components/SelectionSaveButton.tsx`
**Lines**: 79
**Purpose**: Floating button for grouping multi-block selections (teacher-editor only)
**Key Exports**:
- `SelectionSaveButton` - Component
- `SelectionSaveButtonProps` - Props interface

---

### 7. Document Editor Internal
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/components/DocumentEditorInternal.tsx`
**Lines**: 292
**Purpose**: Internal editor component that initializes extensions and manages storage
**Key Exports**:
- `DocumentEditorInternal` - Component
- `DocumentEditorInternalProps` - Props interface
- `LibraryStorage` - Storage interface

---

### 8. Document Editor (Wrapper)
**Path**: `/Users/nikita.yakunin/personal/mono/packages/editor/src/components/DocumentEditor.tsx`
**Lines**: 226
**Purpose**: Public API component that initializes Y.Doc and HocuspocusProvider
**Key Exports**:
- `DocumentEditor` - Component
- `DocumentEditorProps` - Props interface
- `DocumentEditorHandle` - Ref interface
- `useConnection` - Context hook
- `useEditorMode` - Context hook

---

## Related Files (Not Fully Analyzed)

### Components Used
- `SlashCommandMenu` - Menu component for slash commands
- `LibraryDrawer` - Drawer for selecting library items
- `EditorStatusBar` - Status bar showing connection status
- `MouseTracker` - Tracks mouse position for collaboration
- `RemoteCursors` - Shows remote user cursors
- `MarqueeOverlay` - Visual selection overlay

### Extensions Used
- `Blank` - Blank node extension
- `Exercise` - Exercise node extension
- `WritingArea` - Writing area node extension
- `Group` - Group node extension
- `NoteBlock` - Note block extension
- `BlockHover` - Block hover effects
- `SelectionSave` - Selection save functionality
- `MarqueeSelection` - Marquee selection
- `BlockSelectionCommands` - Block selection commands
- `DocumentContext` - Document context storage

---

## File Organization

```
packages/editor/src/
├── components/
│   ├── DocumentEditor.tsx (226 lines)
│   ├── DocumentEditorInternal.tsx (292 lines)
│   ├── editor-toolbar.tsx (97 lines)
│   ├── toolbar-button.tsx (44 lines)
│   ├── SelectionSaveButton.tsx (79 lines)
│   ├── SlashCommandMenu.tsx (not analyzed)
│   ├── LibraryDrawer.tsx (not analyzed)
│   └── ... other components
├── extensions/
│   ├── SlashCommand.tsx (330 lines)
│   ├── BlankView.tsx (56 lines)
│   ├── Blank.ts (not analyzed)
│   ├── Exercise.ts (not analyzed)
│   └── ... other extensions
└── types/
    └── index.ts (defines EditorMode)

apps/teacher/src/
└── spaces/document-editor/
    └── use-file-upload.ts (267 lines)
```

---

## Type Definitions

### EditorMode
```typescript
type EditorMode = "student" | "teacher-lesson" | "teacher-editor";
```

### AttachedFile
```typescript
interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  fileId?: string;
  error?: string;
}
```

### UploadedFile
```typescript
interface UploadedFile {
  fileId: string;
  filename: string;
  mimeType: string;
}
```

### CommandItem
```typescript
interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}
```

---

## Storage Interfaces

### Editor Storage (Tiptap)
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

### LibraryStorage
```typescript
interface LibraryStorage {
  saveExercise?: (title: string, content: string) => Promise<void>;
}
```

---

## Dependencies

### External Libraries
- `@tiptap/core` - Editor framework
- `@tiptap/react` - React integration
- `@tiptap/suggestion` - Suggestion plugin
- `@floating-ui/dom` - Positioning library
- `@tanstack/react-query` - Data fetching
- `@hocuspocus/provider` - WebSocket provider
- `yjs` - CRDT library
- `lucide-react` - Icons
- `@package/ui` - UI components (shadcn)

### Internal Packages
- `@package/editor` - Editor package
- `@app/backend` - Backend API

---

## Key Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| File Upload Hook | `use-file-upload.ts` | Manage file uploads with validation |
| Toolbar Button | `toolbar-button.tsx` | Reusable button with icon & tooltip |
| Editor Toolbar | `editor-toolbar.tsx` | Render formatting buttons |
| Slash Commands | `SlashCommand.tsx` | Mode-filtered command menu |
| Mode-Based Rendering | `BlankView.tsx` | Render different UI by mode |
| Mode-Gated Component | `SelectionSaveButton.tsx` | Only render for teacher-editor |
| Editor Storage | `DocumentEditorInternal.tsx` | Share data without prop drilling |
| Custom Events | `SlashCommand.tsx` + `DocumentEditorInternal.tsx` | Cross-component communication |


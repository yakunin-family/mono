# Image Extension for Language Learning Editor

## Context

### Original Request

Add an Image building block to the Tiptap-based collaborative editor for language learning. This is the first of 4 planned building blocks (others: Multiple Choice, Sequencing, Matching - planned separately).

### Interview Summary

**Key Discussions**:

- Image should be block-level (full width, takes own line)
- Upload via Convex file storage only (no external URLs)
- Store `storageId` in node attributes, resolve URL at render time (for URL stability)
- Optional plain text caption below image
- No resize capability - always full width
- Multiple entry points: toolbar button, slash command `/image`, paste from clipboard
- File constraints: 10MB max, JPEG/PNG/GIF/WebP only

**Mode Behavior**:

- `student`: View only (image + caption visible, not editable)
- `teacher-lesson`: View only (same as student)
- `teacher-editor`: Full edit (upload, edit caption, delete)

### Metis Review

**Identified Gaps** (addressed):

- Storage strategy: Confirmed `storageId` over URL for persistence
- Upload triggers: All three (toolbar + slash + paste)
- File constraints: Industry standard defaults applied
- Error handling: Show retry option on failure
- Upload state: Spinner placeholder during upload

---

## Work Objectives

### Core Objective

Create a Tiptap Image extension that enables teachers to insert and manage images in collaborative documents, with proper storage in Convex, multiple insertion methods, and mode-based rendering.

### Concrete Deliverables

- `packages/editor/src/extensions/image.ts` - Tiptap extension definition
- `packages/editor/src/extensions/image-view.tsx` - React NodeView component
- `packages/editor/src/components/image/` - Supporting components (upload, caption, placeholder)
- `apps/backend/convex/images.ts` - Convex actions for image upload/URL resolution
- Toolbar integration with image button
- SlashCommand integration with `/image` command
- Paste handler for clipboard images

### Definition of Done

- [x] Teacher can insert images via toolbar button
- [x] Teacher can insert images via `/image` slash command
- [x] Teacher can paste images from clipboard
- [x] Images upload to Convex and display correctly
- [x] Caption is editable in teacher-editor mode
- [x] Students see images but cannot edit/delete
- [x] Document save/load preserves images correctly
- [x] Images work in collaborative editing (multiple users)

### Must Have

- Block-level image node with `storageId` attribute
- File validation (10MB, JPEG/PNG/GIF/WebP)
- Upload progress/loading state
- Error handling with retry option
- Optional caption (plain text)
- Alt text attribute (accessibility)
- Mode-based rendering (edit vs view)

### Must NOT Have (Guardrails)

- No image resize, crop, rotate, or manipulation
- No external URL support (Convex storage only)
- No multiple images per node (single image only)
- No gallery/carousel functionality
- No lightbox/zoom preview
- No rich text in caption (plain string only)
- No drag-drop reordering of images within document
- No `as any` casts - use module augmentation for storage types

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: Unknown (not checked)
- **User wants tests**: Manual verification only
- **Framework**: N/A

### Manual QA Only

Each TODO includes verification procedures. Since Tiptap extensions are difficult to test programmatically, all verification is manual via browser interaction.

**Evidence Required:**

- Screenshots for visual changes
- Browser console logs for errors
- Network tab verification for uploads

---

## Task Flow

```
Task 0 (Backend) ──┬──► Task 1 (Extension) ──► Task 2 (NodeView) ──► Task 3 (Toolbar) ──┬──► Task 6 (Integration)
                   │                                                                       │
                   └──────────────────────────────────────────────────────────────────────┘
                                                                                           │
Task 4 (Slash) ────────────────────────────────────────────────────────────────────────────┤
                                                                                           │
Task 5 (Paste) ────────────────────────────────────────────────────────────────────────────┘
```

## Parallelization

| Group | Tasks   | Reason                                           |
| ----- | ------- | ------------------------------------------------ |
| A     | 3, 4, 5 | Independent entry points (toolbar, slash, paste) |

| Task    | Depends On | Reason                                   |
| ------- | ---------- | ---------------------------------------- |
| 1       | 0          | Extension needs backend upload action    |
| 2       | 1          | NodeView needs extension attributes      |
| 3, 4, 5 | 2          | Entry points need NodeView working       |
| 6       | 3, 4, 5    | Final integration after all entry points |

---

## TODOs

- [x] 0. Create Convex Image Upload Action

  **What to do**:
  - Create `apps/backend/convex/images.ts` with:
    - `generateUploadUrl` mutation (returns upload URL for client)
    - `saveImage` mutation (saves storageId, returns document ID)
    - `getImageUrl` query (resolves storageId to URL)
  - Add file validation (size ≤10MB, type in allowed list)
  - Use Convex's built-in file storage (`ctx.storage`)

  **Must NOT do**:
  - Don't couple with existing chat file upload
  - Don't add authentication (use existing auth patterns)
  - Don't add image processing/transformation

  **Parallelizable**: NO (foundation task)

  **References**:

  **Pattern References**:
  - `apps/backend/convex/chat.ts:uploadChatFile` - Existing file upload pattern with `ctx.storage`
  - `apps/backend/convex/schema.ts` - Schema patterns for file storage

  **API/Type References**:
  - Convex file storage docs: https://docs.convex.dev/file-storage

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Using Convex dashboard:
    - Navigate to Functions tab
    - Find `images:generateUploadUrl`
    - Run → should return a URL string
  - [x] Using curl/httpie:
    - Upload a test image to the generated URL
    - Call `images:saveImage` with storageId
    - Call `images:getImageUrl` with returned ID
    - Verify URL returns the image

  **Commit**: YES
  - Message: `feat(backend): add convex image upload actions`
  - Files: `apps/backend/convex/images.ts`

---

- [x] 1. Create Image Tiptap Extension

  **What to do**:
  - Create `packages/editor/src/extensions/image.ts`
  - Define as block node (`group: "block"`, no content)
  - Attributes:
    - `storageId: string` - Convex storage ID
    - `caption: string | null` - Optional caption text
    - `alt: string | null` - Alt text for accessibility
  - Add module augmentation for type-safe storage if needed
  - Implement `parseHTML` and `renderHTML` for serialization
  - Add `insertImage` command
  - Register React NodeView renderer

  **Must NOT do**:
  - No image manipulation attributes (width, height, crop)
  - No external URL support
  - No `as any` casts

  **Parallelizable**: NO (depends on Task 0)

  **References**:

  **Pattern References**:
  - `packages/editor/src/extensions/Exercise.ts:1-132` - Block node pattern, commands, parseHTML/renderHTML
  - `packages/editor/src/extensions/WritingArea.ts:1-70` - Simpler block node with attributes
  - `packages/editor/src/extensions/Blank.ts:1-72` - Module augmentation pattern

  **Why Each Reference Matters**:
  - Exercise.ts shows how to create block nodes with custom commands and React NodeView
  - WritingArea.ts shows simpler attribute serialization (data-\* pattern)
  - Blank.ts shows module augmentation for Storage interface

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Run `pnpm dev` in monorepo root
  - [x] Open teacher app at localhost:3000
  - [x] Open browser console, run:
    ```javascript
    // Get editor instance from React DevTools or window
    editor.commands.insertImage({
      storageId: "test",
      caption: null,
      alt: null,
    });
    ```
  - [x] Verify image node appears in editor (may show placeholder/error since storageId is fake)
  - [x] Check document structure via `editor.getJSON()` - should contain image node

  **Commit**: YES
  - Message: `feat(editor): add Image tiptap extension`
  - Files: `packages/editor/src/extensions/image.ts`

---

- [x] 2. Create Image NodeView Component

  **What to do**:
  - Create `packages/editor/src/extensions/image-view.tsx`
  - Create supporting components in `packages/editor/src/components/image/`:
    - `image-display.tsx` - Renders image with resolved URL
    - `image-caption.tsx` - Editable/view-only caption
    - `image-placeholder.tsx` - Loading/error states
  - Implement mode-based rendering:
    - `student`: Image + caption, read-only, no controls
    - `teacher-lesson`: Same as student
    - `teacher-editor`: Image + editable caption + delete button
  - Resolve `storageId` to URL using Convex query
  - Handle loading state (spinner placeholder)
  - Handle error state (broken image icon + retry)

  **Must NOT do**:
  - No resize handles or manipulation
  - No lightbox/zoom on click
  - No rich text in caption (plain input only)

  **Parallelizable**: NO (depends on Task 1)

  **References**:

  **Pattern References**:
  - `packages/editor/src/extensions/ExerciseView.tsx:1-295` - Mode-based rendering, storage access, delete button
  - `packages/editor/src/extensions/BlankView.tsx:1-56` - Simpler mode-based component switching
  - `packages/editor/src/extensions/WritingAreaView.tsx:1-55` - NodeViewWrapper usage
  - `packages/editor/src/components/blank/StudentBlankInput.tsx` - Component organization pattern

  **API/Type References**:
  - `packages/editor/src/types.ts:EditorMode` - Mode type definition
  - `packages/editor/src/contexts/EditorModeContext.tsx` - useEditorMode hook

  **External References**:
  - TanStack Query for Convex: Use `convexQuery` wrapper for `images.getImageUrl`

  **Why Each Reference Matters**:
  - ExerciseView shows how to access mode, render controls, handle selection
  - BlankView shows simpler mode-based component switching pattern
  - Component folder pattern shows how to organize supporting components

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Using playwright browser automation (or manual browser):
    - Open teacher editor at localhost:3000
    - Insert image node (via console command from Task 1)
    - Screenshot: Verify placeholder/loading state appears
  - [x] After uploading real image (via Task 0 manually):
    - Verify image renders at full width
    - Verify caption field is editable (teacher-editor mode)
    - Switch to student view → verify read-only
  - [x] Error handling:
    - Insert image with invalid storageId
    - Verify error state with broken image icon
    - Verify retry button appears

  **Commit**: YES
  - Message: `feat(editor): add Image NodeView with mode-based rendering`
  - Files: `packages/editor/src/extensions/image-view.tsx`, `packages/editor/src/components/image/*`

---

- [x] 3. Add Toolbar Image Button

  **What to do**:
  - Find toolbar component in editor package
  - Add image upload button (icon: ImageIcon from lucide-react)
  - Only show in `teacher-editor` mode
  - On click: Open file picker dialog
  - On file select: Validate file (size, type)
  - If valid: Upload to Convex, then insert image node
  - If invalid: Show error toast
  - During upload: Show loading state on button or in editor

  **Must NOT do**:
  - Don't show button in student or teacher-lesson modes
  - Don't allow files >10MB or non-image types

  **Parallelizable**: YES (with Tasks 4, 5)

  **References**:

  **Pattern References**:
  - `packages/editor/src/components/DocumentEditorToolbar.tsx` - Existing toolbar structure
  - `apps/teacher/src/spaces/document-editor/use-file-upload.ts` - File upload hook pattern

  **External References**:
  - Convex file upload guide: https://docs.convex.dev/file-storage/upload-files

  **Why Each Reference Matters**:
  - Toolbar component shows where to add new buttons and how they're organized
  - use-file-upload shows the pattern for generating upload URLs and handling uploads

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Using browser:
    - Open teacher editor at localhost:3000
    - Verify image button appears in toolbar
    - Switch to student mode → verify button hidden
  - [x] Upload flow:
    - Click image button → file picker opens
    - Select valid image → upload starts
    - Upload completes → image appears in document
  - [x] Validation:
    - Try uploading 15MB file → error toast
    - Try uploading .pdf file → error toast

  **Commit**: YES
  - Message: `feat(editor): add image button to toolbar`
  - Files: `packages/editor/src/components/DocumentEditorToolbar.tsx`, related upload logic

---

- [x] 4. Add Slash Command for Image

  **What to do**:
  - Find SlashCommand configuration
  - Add `/image` command
  - Filter to only show in `teacher-editor` mode
  - On select: Same flow as toolbar (file picker → upload → insert)
  - Add appropriate icon and description

  **Must NOT do**:
  - Don't show command in student or teacher-lesson modes

  **Parallelizable**: YES (with Tasks 3, 5)

  **References**:

  **Pattern References**:
  - `packages/editor/src/extensions/SlashCommand.tsx` - Slash command registration and mode filtering

  **Why Each Reference Matters**:
  - SlashCommand shows exactly how to add new commands with mode filtering

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Using browser:
    - Open teacher editor at localhost:3000
    - Type `/` to open slash menu
    - Verify "Image" option appears with icon
    - Switch to student mode → type `/` → verify Image NOT shown
  - [x] Insert flow:
    - Select Image from slash menu → file picker opens
    - Complete upload → image inserted at cursor position

  **Commit**: YES
  - Message: `feat(editor): add /image slash command`
  - Files: `packages/editor/src/extensions/SlashCommand.tsx` or related config

---

- [x] 5. Add Paste Handler for Images

  **What to do**:
  - Add paste event handler to editor
  - Detect image data in clipboard (image/png, image/jpeg, etc.)
  - Only process in `teacher-editor` mode
  - If image found: Convert to File, upload to Convex, insert node
  - If not image or wrong mode: Let default paste behavior proceed
  - Handle multiple images in paste (insert multiple nodes)

  **Must NOT do**:
  - Don't intercept non-image pastes
  - Don't allow paste in student/teacher-lesson modes
  - Don't process SVGs (security)

  **Parallelizable**: YES (with Tasks 3, 4)

  **References**:

  **Pattern References**:
  - Tiptap paste handling: Use `addProseMirrorPlugins` with clipboardPlugin or editor event handlers
  - `packages/editor/src/extensions/Exercise.ts:addProseMirrorPlugins` - ProseMirror plugin pattern

  **External References**:
  - Clipboard API docs: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

  **Why Each Reference Matters**:
  - ProseMirror plugins can intercept paste events before default handling
  - Exercise.ts shows how to add plugins to an extension

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Using browser:
    - Open teacher editor at localhost:3000
    - Copy an image from another app/browser
    - Paste into editor (Ctrl/Cmd+V)
    - Verify upload starts and image appears
  - [x] Mode restriction:
    - Switch to student mode
    - Paste image → verify nothing happens (or text pastes normally)
  - [x] Multiple images:
    - Copy multiple images
    - Paste → verify all images upload and insert

  **Commit**: YES
  - Message: `feat(editor): add paste handler for images`
  - Files: `packages/editor/src/extensions/image.ts` (plugin) or dedicated paste extension

---

- [x] 6. Integration Testing & Polish

  **What to do**:
  - Test complete flow end-to-end
  - Verify document save/load preserves images
  - Verify collaborative editing works (two users)
  - Fix any edge cases discovered
  - Update editor exports in `packages/editor/src/index.ts`
  - Ensure Image extension is registered in document editor

  **Must NOT do**:
  - Don't add features not specified
  - Don't optimize prematurely

  **Parallelizable**: NO (depends on Tasks 3, 4, 5)

  **References**:

  **Pattern References**:
  - `packages/editor/src/index.ts` - Export patterns
  - `packages/editor/src/components/DocumentEditor.tsx` - Extension registration

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [x] Save/Load:
    - Insert image with caption
    - Refresh page → verify image and caption persist
    - Close and reopen document → verify persistence
  - [x] Collaboration:
    - Open same document in two browser windows
    - Insert image in one → verify appears in other
    - Edit caption in one → verify syncs to other
  - [x] All entry points work:
    - [x] Toolbar button → image inserts
    - [x] Slash command → image inserts
    - [x] Paste → image inserts
  - [x] Mode behavior:
    - [x] Teacher-editor: full functionality
    - [x] Teacher-lesson: view only
    - [x] Student: view only

  **Commit**: YES
  - Message: `feat(editor): complete Image extension integration`
  - Files: `packages/editor/src/index.ts`, related fixes

---

## Commit Strategy

| After Task | Message                                                      | Files                                     | Verification          |
| ---------- | ------------------------------------------------------------ | ----------------------------------------- | --------------------- |
| 0          | `feat(backend): add convex image upload actions`             | `apps/backend/convex/images.ts`           | Convex dashboard test |
| 1          | `feat(editor): add Image tiptap extension`                   | `packages/editor/src/extensions/image.ts` | Console command       |
| 2          | `feat(editor): add Image NodeView with mode-based rendering` | image-view.tsx, components/image/\*       | Visual inspection     |
| 3          | `feat(editor): add image button to toolbar`                  | Toolbar component                         | Upload flow           |
| 4          | `feat(editor): add /image slash command`                     | SlashCommand config                       | Slash menu            |
| 5          | `feat(editor): add paste handler for images`                 | image.ts (plugin)                         | Paste test            |
| 6          | `feat(editor): complete Image extension integration`         | index.ts, fixes                           | E2E verification      |

---

## Success Criteria

### Verification Commands

```bash
# Start dev environment
pnpm dev

# Open teacher app
open http://localhost:3000

# After testing, verify no console errors
# Check Network tab for successful uploads
```

### Final Checklist

- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Images persist across page refresh
- [x] Collaboration works (multi-user)
- [x] All three entry points work (toolbar, slash, paste)
- [x] Mode behavior correct (student view-only)
- [x] Error handling works (invalid files, failed uploads)

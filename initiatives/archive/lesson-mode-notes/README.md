# Lesson Mode Notes Initiative

## Overview
Add note blocks to the collaborative document editor that allow teachers to insert ad-hoc annotations during lessons. These notes are editable by both teachers and students, while the main lesson content remains read-only in lesson mode.

## Problem
Teachers need a way to add contextual notes, annotations, and comments during live lessons without switching back to full editor mode. Currently, in lesson mode, all content except interactive elements (blanks, exercises) is read-only, making it impossible for teachers to add supplementary information on the fly.

## Solution
Implement a special "note block" node type in Tiptap that:
- Can only be created by teachers (via UI controls)
- Can be edited by both teachers and students
- Is visually distinct from main lesson content (yellow background, icon)
- Can contain any standard block content (paragraphs, lists, etc.)
- Exists at the top level only (no nesting)
- Is always editable via `contentEditable={true}` attribute (works with lesson-mode-editability system)

## Tasks

0. **[Create NoteBlock Extension](./task-0-create-noteblock-extension.md)** - Core Tiptap node extension with proper TypeScript types
1. **[Create NoteBlockView Component](./task-1-create-noteblockview-component.md)** - React NodeView component with contentEditable
2. **[Add Note Block Styling](./task-2-add-note-block-styling.md)** - CSS for visual distinction (yellow background, border, etc.)
3. **[Implement Note Insertion UI](./task-3-implement-note-insertion-ui.md)** - Toolbar button for inserting notes
4. **[Register Extension in Editor](./task-4-register-extension-in-editor.md)** - Integrate NoteBlock into DocumentEditor configuration
5. **[Test Note Block Behavior](./task-5-test-note-block-behavior.md)** - Manual testing and verification

## Dependencies

**Packages:**
- `@tiptap/core` - Already installed
- `@tiptap/react` - Already installed
- `@tiptap/pm` - Already installed

**Commands:**
- `pnpm --filter @package/editor build` - Build editor package after changes
- `pnpm dev:teacher` - Test in teacher app
- `pnpm dev:student` - Test in student app

**Prerequisites:**
- Existing Tiptap editor setup in `packages/editor`
- Existing editor mode system (`"student"` | `"teacher-lesson"` | `"teacher-editor"`)
- Existing custom node examples (Blank.ts, Exercise.ts)

**Related Initiatives:**
- **lesson-mode-editability** - Provides contentEditable-based read-only control system
  - Note blocks use `contentEditable={true}` to remain editable regardless of mode
  - **These initiatives are independent** - lesson-mode-notes can be developed and completed standalone
  - When lesson-mode-editability is later implemented, note blocks will automatically work correctly due to nested `contentEditable` behavior
  - Note blocks serve as a reference implementation for other interactive elements

## Key Files

**Files to Create:**
- `packages/editor/src/extensions/NoteBlock.ts` - Extension definition
- `packages/editor/src/extensions/NoteBlockView.tsx` - React component
- `packages/editor/src/styles/note-block.css` - Styling (or add to existing styles)
- `packages/editor/src/components/InsertNoteButton.tsx` - UI for inserting notes

**Files to Modify:**
- `packages/editor/src/extensions/index.ts` - Export new extension
- `packages/editor/src/DocumentEditor.tsx` - Register extension and add insert UI
- `packages/editor/src/styles/editor.css` - Add lesson mode editability rules (or in note-block.css)

## Technical Approach

### Node Structure
- **Node Type:** Block-level node (`group: "block"`)
- **Content Model:** `content: "block+"` (can contain paragraphs, lists, headings, etc.)
- **Nesting Prevention:** Use `defining: true` to prevent notes inside notes
- **Attributes:** No special attributes needed for MVP (no ownership tracking)

### Editability Control
Use `contentEditable` attribute for always-editable behavior:

```typescript
// In NoteBlockView component
<NodeViewWrapper
  contentEditable={true}  // Always editable, regardless of mode
  suppressContentEditableWarning
>
  {/* Note content */}
</NodeViewWrapper>
```

**How it works:**
- Note blocks have `contentEditable={true}` set on their NodeViewWrapper
- This makes them editable even when nested inside read-only content
- Browser handles nested `contentEditable` natively
- When integrated with lesson-mode-editability, read-only content has `contentEditable={false}`, but notes override this with `contentEditable={true}`

**Example nested structure:**
```html
<p contenteditable="false">Read-only lesson content</p>
<div contenteditable="true" data-type="note-block">
  <p>Editable note content</p>
</div>
```

### Visual Design
- **Background:** Light yellow (`#fffbeb`)
- **Border:** 4px yellow accent on left side (`#fbbf24`)
- **Icon:** 📝 emoji in header
- **Label:** "Note" text label
- **Shadow:** Subtle box-shadow for depth

### Insertion UI
**MVP Approach:** Add toolbar button in lesson mode
- Simple, predictable UX
- Less implementation complexity
- Can be upgraded to floating "+" button later

**Future Enhancement:** Floating "+" button between blocks
- More polished UX
- Requires hover detection and position calculation

## Success Criteria

- [ ] Task 0 complete - NoteBlock extension created
- [ ] Task 1 complete - NoteBlockView component created with contentEditable
- [ ] Task 2 complete - Visual styling applied and tested
- [ ] Task 3 complete - Insertion UI functional
- [ ] Task 4 complete - Extension registered in editor
- [ ] Task 5 complete - Manual testing passed

**Acceptance Criteria:**
- [ ] Teachers can insert note blocks via toolbar button
- [ ] Both teachers and students can edit content inside notes
- [ ] Notes are visually distinct from main content (yellow background, border, icon)
- [ ] Notes have `contentEditable={true}` in their NodeView
- [ ] Notes cannot be nested inside other notes (`defining: true`)
- [ ] Real-time collaboration works within note blocks
- [ ] Note blocks can contain any standard content (paragraphs, lists, headings, etc.)
- [ ] No TypeScript errors or use of `as any`

## Future Enhancements

**Out of scope for MVP:**
- Floating "+" button with hover detection (start with toolbar button)
- Student-created notes (teachers only for MVP)
- Note attribution/ownership tracking (who wrote what)
- Note timestamps or edit history
- Collapsible notes
- Note-specific formatting options
- Export/print distinction between main content and notes
- Note search/filtering
- Private vs. shared notes
- Note templates or quick snippets

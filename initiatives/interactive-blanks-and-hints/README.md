# Interactive Blanks and Hints Initiative

## Overview
Transform AI-generated fill-in-the-blank exercises from plain text to interactive custom Tiptap nodes with role-based rendering.

## Problem
- Blanks (`[[blank]]`) stay as plain text - not using editor primitives
- Hints shown as italic paragraphs - clutters document
- No interactive inputs for students
- No validation or teacher feedback

## Solution
Custom inline Tiptap node with three rendering modes:
- **Student:** Input fields with hint icons
- **Teacher Lesson:** Read-only view with validation and peek
- **Teacher Editor:** Interactive badges for inline editing

## Tasks

Execute tasks in order:

0. **[Update Backend Prompt](./task-0-update-backend-prompt.md)** - ⚠️ **START HERE** - Remove numbered blank IDs from schema and prompt
1. **[Blank Node Foundation](./task-1-blank-node-foundation.md)** - Core custom node + mode system
2. **[Parsing Logic](./task-2-parsing-logic.md)** - Convert `[[blank]]` to Blank nodes
3. **[Student Mode](./task-3-student-mode.md)** - Interactive input with real-time sync
4. **[Hints System](./task-4-hints-system.md)** - Icon with tooltip
5. **[Teacher Lesson Mode](./task-5-teacher-lesson-mode.md)** - Validation & peek
6. **[Teacher Editor Mode](./task-6-teacher-editor-mode.md)** - Inline badge editing
7. **[Slash Command & Polish](./task-7-slash-command-polish.md)** - Commands, accessibility, final polish

## Dependencies

### Task 4 requires:
```bash
cd packages/ui
pnpx shadcn@latest add tooltip
```

### Task 6 requires:
```bash
cd packages/ui
pnpx shadcn@latest add badge
```

## Key Files

### Created
- `/packages/editor/src/extensions/Blank.ts` - Node definition
- `/packages/editor/src/extensions/BlankView.tsx` - React NodeView
- `/packages/editor/src/components/blank/StudentBlankInput.tsx`
- `/packages/editor/src/components/blank/HintTooltip.tsx`
- `/packages/editor/src/components/blank/TeacherLessonBlank.tsx`
- `/packages/editor/src/components/blank/TeacherEditorBadge.tsx`
- `/packages/editor/src/utils/blankValidation.ts`

### Modified

**Backend:**
- `/apps/backend/convex/validators/exerciseGeneration.ts` - Remove `id` from blank schema
- `/apps/backend/prompts/generate-exercises.md` - Change to unnumbered `[[blank]]`
- `/packages/editor/src/types/exerciseGeneration.ts` - Remove `id` from FillBlanksBlank type

**Frontend:**
- `/packages/editor/src/utils/exerciseToTiptap.ts` - Parsing logic
- `/packages/editor/src/components/DocumentEditor.tsx` - Mode prop
- `/packages/editor/src/components/DocumentEditorInternal.tsx` - Extension registration
- `/packages/editor/src/extensions/SlashCommand.tsx` - Blank command
- `/packages/editor/src/types.ts` - EditorMode type

## Technical Approach

### Inline Atomic Node
- `inline: true` - Fits within text flow
- `atom: true` - Single unit, no cursor inside
- Stores: correctAnswer, alternatives, hint, studentAnswer

### Mode-Based Rendering
Mode stored in `editor.storage.editorMode`:
- Accessed in React NodeViews
- Determines which component to render
- Passed from app-level prop

### Real-Time Sync
- `updateAttributes()` triggers Yjs update
- Automatic sync via Hocuspocus
- No manual backend calls needed

### Validation
- Frontend-only (no backend yet)
- Case-insensitive, trimmed
- Accepts alternative answers
- Updates reactively as student types

## Success Criteria
- [x] Plan complete
- [ ] Task 0: Backend schema & prompt
- [ ] Task 1: Foundation
- [ ] Task 2: Parsing
- [ ] Task 3: Student mode
- [ ] Task 4: Hints
- [ ] Task 5: Teacher lesson
- [ ] Task 6: Teacher editor
- [ ] Task 7: Polish

When all tasks complete:
- Students can fill blanks with real-time sync
- Teachers see validation and can peek answers
- Teachers can edit correct answers inline
- Hints display as icon tooltips
- AI exercises parse correctly
- Slash command works
- Accessible and mobile-friendly

## Future Enhancements (Out of Scope)
- Per-user answer storage (separate for each student)
- Answer history/revision tracking
- Advanced validation (fuzzy matching, synonyms)
- Hint levels (progressive hints)
- Multiple choice blanks (dropdown)
- Analytics dashboard
- Backend grading system

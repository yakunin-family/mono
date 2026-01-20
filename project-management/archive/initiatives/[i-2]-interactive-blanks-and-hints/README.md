---
status: done
priority: high
description: Transform AI-generated fill-in-the-blank exercises to interactive Tiptap nodes
tags: [editor, tiptap, exercises, completed]
---

# Interactive Blanks and Hints Initiative

## Overview

Transform AI-generated fill-in-the-blank exercises from plain text to interactive custom Tiptap nodes with role-based rendering.

**Status: Completed** - All tasks finished successfully.

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

- [t-1] Update Backend Prompt - Remove numbered blank IDs from schema
- [t-2] Blank Node Foundation - Core custom node + mode system
- [t-3] Parsing Logic - Convert `[[blank]]` to Blank nodes
- [t-4] Student Mode - Interactive input with real-time sync
- [t-5] Hints System - Icon with tooltip
- [t-6] Teacher Lesson Mode - Validation & peek
- [t-7] Teacher Editor Mode - Inline badge editing
- [t-8] Slash Command & Polish - Commands, accessibility, final polish

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
- `/apps/backend/convex/validators/exerciseGeneration.ts`
- `/apps/backend/prompts/generate-exercises.md`
- `/packages/editor/src/utils/exerciseToTiptap.ts`
- `/packages/editor/src/components/DocumentEditor.tsx`

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

## Success Criteria

All completed:
- [x] Students can fill blanks with real-time sync
- [x] Teachers see validation and can peek answers
- [x] Teachers can edit correct answers inline
- [x] Hints display as icon tooltips
- [x] AI exercises parse correctly
- [x] Slash command works
- [x] Accessible and mobile-friendly

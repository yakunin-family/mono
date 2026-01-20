---
status: done
priority: high
description: Create core Blank extension as custom inline Tiptap node
tags: [tiptap, extension]
references: blocked-by:t-7
---

# Blank Node Foundation

## Objective

Create the core Blank extension as a custom inline Tiptap node with mode detection and placeholder rendering.

## Files Created

- `/packages/editor/src/extensions/Blank.ts` - Custom inline node with attributes
- `/packages/editor/src/extensions/BlankView.tsx` - React NodeView with mode detection
- `/packages/editor/src/types.ts` - EditorMode type definition

## Files Modified

- `/packages/editor/src/components/DocumentEditor.tsx` - Add mode prop
- `/packages/editor/src/components/DocumentEditorInternal.tsx` - Store mode in editor storage
- `/packages/editor/src/index.ts` - Export new extension and types

## Attributes

- `blankIndex: number` - position in sentence (0, 1, 2...)
- `correctAnswer: string`
- `alternativeAnswers: string[]`
- `hint: string | null`
- `studentAnswer: string`

## Acceptance Criteria

- [x] Blank node can be manually inserted into editor
- [x] Node renders as inline element (within text flow)
- [x] Different placeholder text appears based on mode
- [x] Mode can be switched and view updates
- [x] No TypeScript errors

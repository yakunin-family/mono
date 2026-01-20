---
status: done
priority: high
description: Ensure blanks and exercises always have contentEditable={true}
tags: [tiptap, extension]
references: blocked-by:t-28
---

# Update Interactive Nodes

## Description

Ensure that interactive nodes (Blank, Exercise, NoteBlock) always have `contentEditable={true}` so they remain editable even inside read-only content.

## Files to Modify

- `packages/editor/src/extensions/Blank.ts`
- `packages/editor/src/extensions/Exercise.ts`
- `packages/editor/src/extensions/NoteBlock.ts`

## Key Pattern

```typescript
<NodeViewWrapper
  contentEditable={true}
  suppressContentEditableWarning
>
  {/* content */}
</NodeViewWrapper>
```

Child `contentEditable={true}` overrides parent `contentEditable={false}`.

## Acceptance Criteria

- [ ] Blanks editable in all modes
- [ ] Exercises editable in all modes
- [ ] Note blocks editable in all modes
- [ ] Nested inside read-only paragraphs works

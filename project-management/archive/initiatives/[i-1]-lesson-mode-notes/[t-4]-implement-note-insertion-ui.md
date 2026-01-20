---
status: done
priority: medium
description: Add toolbar button for teachers to insert note blocks
tags: [ui, toolbar]
references: blocked-by:t-1
---

# Implement Note Insertion UI

## Description

Add UI controls for teachers to insert note blocks. Start with a toolbar button (simpler MVP approach) rather than floating "+" button.

## Files to Modify

- `packages/editor/src/DocumentEditorToolbar.tsx`

## UI Considerations

**MVP Approach (Toolbar Button):**
- ✅ Simple to implement
- ✅ Predictable location
- ✅ Clear affordance
- ❌ Less contextual than floating button

**Future Enhancement (Floating "+" Button):**
- Show "+" button on hover between blocks
- Requires mouse position tracking
- More polished but complex
- Defer to post-MVP

## Acceptance Criteria

- [ ] Toolbar button added for inserting notes
- [ ] Button only visible when `mode === "teacher-lesson"`
- [ ] Clicking button inserts a note block at cursor position
- [ ] Button has clear label ("📝 Note" or similar)
- [ ] Button styled consistently with other toolbar buttons

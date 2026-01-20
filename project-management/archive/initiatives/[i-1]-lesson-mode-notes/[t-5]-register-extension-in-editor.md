---
status: done
priority: high
description: Export and register NoteBlock extension in DocumentEditor
tags: [integration]
references: blocked-by:t-1, blocked-by:t-2
---

# Register Extension in Editor

## Description

Export the NoteBlock extension and register it in the DocumentEditor configuration so it's available for use.

## Files to Modify

- `packages/editor/src/extensions/index.ts` - Export the extension
- `packages/editor/src/DocumentEditor.tsx` - Add to editor extensions array

## Extension Order

Extension order can matter for some features. Place `NoteBlock`:
- **After** StarterKit (provides base functionality)
- **After** Collaboration extensions (ensures sync works)
- **Alongside** other custom nodes (Blank, Exercise)

## Acceptance Criteria

- [ ] NoteBlock exported from `extensions/index.ts`
- [ ] NoteBlock imported in `DocumentEditor.tsx`
- [ ] NoteBlock added to editor's extensions array
- [ ] Extension registered in correct order
- [ ] `pnpm --filter @package/editor build` succeeds
- [ ] No console errors when editor loads

---
status: done
priority: medium
description: Add slash command, toolbar button, and final polish
tags: [ui, accessibility, polish]
references: blocked-by:t-12, blocked-by:t-13
---

# Slash Command & Polish

## Objective

Add slash command to insert blanks, optional toolbar button, and final polish (styling, accessibility, edge cases).

## Files Modified

- `/packages/editor/src/extensions/SlashCommand.tsx` - Add blank command
- `/packages/editor/src/components/DocumentEditorToolbar.tsx` - Optional toolbar button

## Features

- Slash command `/blank` inserts blank in teacher-editor mode
- Optional toolbar button for inserting blanks
- Consistent styling across all modes
- Accessibility: ARIA labels, keyboard navigation
- Edge case handling: empty answers, long text, special characters
- Mobile/touch friendly

## Acceptance Criteria

- [x] Teachers can insert blank via slash command `/blank`
- [x] Slash command only appears in teacher-editor mode
- [x] All styling is consistent and polished
- [x] Accessibility checklist complete
- [x] Edge cases handled gracefully
- [x] Mobile/touch tested and working
- [x] No performance issues with many blanks

---
status: done
priority: medium
description: Replace plain text hints with icon tooltips
tags: [ui, tooltip]
references: blocked-by:t-10
---

# Hints System - Icon with Tooltip

## Objective

Replace plain text hints with an icon (💡) that shows hint text in a tooltip on hover/click.

## Dependencies

- shadcn/ui tooltip component: `pnpx shadcn@latest add tooltip`

## Files Created

- `/packages/editor/src/components/blank/HintTooltip.tsx`

## Functionality

- Icon (💡 emoji or Lucide Lightbulb)
- Tooltip from shadcn/ui
- Hover shows tooltip (default behavior)
- Click keeps tooltip open
- Click outside dismisses
- Max width: 200px
- Positioned adjacent to blank (right side)

## Acceptance Criteria

- [x] Hint icon (💡) appears next to blank inputs when hint exists
- [x] No icon appears when hint is null/empty
- [x] Hover shows tooltip with hint text
- [x] Click toggles tooltip open/closed
- [x] Tooltip dismisses when clicking outside
- [x] Tooltip has max width of 200px

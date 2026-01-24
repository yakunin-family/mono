---
status: todo
priority: medium
description: Add collapse/expand behavior for tool calls in chat messages
tags: [editor, frontend]
references: blocked-by:t-108
---

# Add tool call collapse/expand behavior

Implement collapsible tool call display to reduce visual clutter while maintaining transparency.

## Requirements

1. While streaming:
   - Show tool calls expanded
   - User can see what the agent is doing in real-time
   - Each tool call shows its name, parameters, and result

2. When message is finished:
   - Collapse tool calls to summary: "Done (N steps)"
   - N = number of tool calls in the message
   - Keep final text response visible

3. Allow toggling:
   - Click on collapsed summary to expand
   - Click again to collapse
   - Persist expanded state in local component state (not persisted)

4. Update `message-parts.tsx` to implement this behavior

## Visual Design

```
Collapsed:
┌─────────────────────────────────────┐
│ 🤖 I've added a fill-in-the-blank  │
│    exercise to the document.        │
│    ▸ Done (3 steps)                 │
└─────────────────────────────────────┘

Expanded:
┌─────────────────────────────────────┐
│ 🤖 I've added a fill-in-the-blank  │
│    exercise to the document.        │
│    ▾ Done (3 steps)                 │
│    ├─ Loaded skill: fill-blanks ✓  │
│    ├─ Editing document... ✓         │
│    └─ Applied changes ✓             │
└─────────────────────────────────────┘
```

## Acceptance Criteria

- [ ] Tool calls show expanded while streaming
- [ ] Tool calls collapse to summary when done
- [ ] Clicking summary expands/collapses
- [ ] Transition is smooth
- [ ] Summary shows correct step count

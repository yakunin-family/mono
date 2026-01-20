---
status: done
priority: low
description: Style read-only content with subtle visual cues
tags: [css, styling]
references: blocked-by:t-35
---

# Add Visual Feedback

## Description

Add subtle visual styling to indicate which content is read-only vs editable.

## Styling Ideas

- Slight opacity (0.95) for read-only content
- Different cursor (default vs text)
- Subtle background color difference
- Border or outline for editable areas

## Files to Create

- `packages/editor/src/styles/lesson-mode.css`

## Acceptance Criteria

- [ ] Read-only content visually distinct
- [ ] Editable areas clearly indicated
- [ ] Not too distracting
- [ ] Works in light mode

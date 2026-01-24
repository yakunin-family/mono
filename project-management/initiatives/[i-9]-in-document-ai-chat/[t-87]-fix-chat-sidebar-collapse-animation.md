---
status: todo
priority: low
description: Fix chat sidebar collapse animation to prevent text reflow
tags: [ui, teacher-app]
---

# Fix Chat Sidebar Collapse Animation to Prevent Text Reflow

The chat sidebar currently changes its physical width when collapsing/expanding. This causes message bubble text to flicker and reflow as the available area changes during the animation.

## Problem

When the sidebar animates between open and closed states by changing its width, the text inside message bubbles reflows continuously as the container width changes. This creates a flickering/jumpy visual effect.

## Solution

Instead of animating the width, the sidebar should render at full width but be positioned outside the viewport when collapsed, then slide into view when opened. This keeps the content stable and prevents text reflow during transitions.

## Acceptance Criteria

- [ ] Sidebar content renders at full width regardless of open/closed state
- [ ] Opening/closing uses transform/translate animation instead of width animation
- [ ] No text reflow or flickering in message bubbles during transition
- [ ] Smooth animation maintained

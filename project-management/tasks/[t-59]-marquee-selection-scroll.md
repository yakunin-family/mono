---
status: todo
priority: low
description: Marquee selection doesn't cause the page to scroll when near the edge of the screen
tags: [editor, bug]
---

# Marquee Selection Doesn't Scroll at Screen Edge

When performing a marquee (box) selection in the editor and the cursor approaches the edge of the screen, the page does not automatically scroll to allow the selection to extend beyond the visible area.

## Expected Behavior

When the user drags a marquee selection and the cursor reaches the edge of the viewport, the page should automatically scroll in that direction to allow the selection to continue beyond the visible content.

## Current Behavior

The selection stops at the edge of the visible area. Users cannot select content that extends beyond the current viewport without manually scrolling first.

## Impact

This affects usability when selecting large portions of content that span beyond the visible screen area.

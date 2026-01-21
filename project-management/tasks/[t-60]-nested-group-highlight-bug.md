---
status: todo
priority: low
description: Multiple nested group sections are highlighted on hover instead of just the innermost one
tags: [editor, bug, ui]
---

# Multiple Nested Group Sections Highlighted on Hover

When hovering over nested group sections in the editor, multiple parent groups are highlighted simultaneously instead of only highlighting the innermost group that the cursor is directly over.

## Expected Behavior

Only the innermost group section directly under the cursor should be highlighted on hover. Parent groups should not show their hover state when the cursor is over a child element.

## Current Behavior

When hovering over a nested group, both the inner group and its parent groups show their hover highlight state, creating visual confusion about which element is being targeted.

## Impact

This makes it difficult for users to understand which specific group they are interacting with, especially in deeply nested structures.

---
status: done
priority: medium
description: Add CSS for visual distinction with yellow background and border
tags: [css, styling]
references: blocked-by:t-2
---

# Add Note Block Styling

## Description

Add CSS styles to visually distinguish note blocks from main content with yellow background, border, and proper spacing.

## Files to Modify

- `packages/editor/src/styles/editor.css` (or create new `note-block.css`)
- `packages/editor/src/DocumentEditor.tsx` (if creating new CSS file)

## Design Specs

- **Background color:** `#fffbeb` (light yellow)
- **Border:** 4px left border, `#fbbf24` (yellow accent)
- **Border radius:** 0.5rem
- **Padding:** 1rem
- **Shadow:** Subtle `0 1px 3px rgba(0, 0, 0, 0.1)`
- **Icon:** 📝 emoji, 1rem size
- **Label:** "Note" in uppercase, 0.875rem font size, yellow-800 color
- **Margin:** 1.5rem top and bottom spacing

## Acceptance Criteria

- [ ] CSS added to editor styles
- [ ] Note blocks have yellow background and left border
- [ ] Header displays icon and label correctly
- [ ] Spacing and padding look balanced
- [ ] Visual distinction is clear from main content

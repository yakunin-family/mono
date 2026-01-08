# Task 2: Add Note Block Styling

## Description
Add CSS styles to visually distinguish note blocks from main content with yellow background, border, and proper spacing.

## Files to Modify
- `packages/editor/src/styles/editor.css` (or create new `note-block.css` if preferred)
- `packages/editor/src/DocumentEditor.tsx` (if creating new CSS file, import it)

## Implementation

Add the following CSS to `packages/editor/src/styles/editor.css`:

```css
/* Note Block Visual Styling */
.note-block-wrapper {
  margin: 1.5rem 0;
}

.note-block-container {
  border-left: 4px solid #fbbf24; /* Yellow-400 */
  background: #fffbeb; /* Yellow-50 */
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.note-block-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #92400e; /* Yellow-800 */
}

.note-block-icon {
  font-size: 1rem;
}

.note-block-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-block-content {
  /* Inner content inherits editor styles */
}

/* Note: Editability is controlled via contentEditable attribute,
   not CSS. See NoteBlockView.tsx for contentEditable={true} */
```

## Alternative: Separate CSS File

If you prefer to keep note block styles separate:

1. Create `packages/editor/src/styles/note-block.css` with the above styles
2. Import in `packages/editor/src/DocumentEditor.tsx`:
   ```typescript
   import "./styles/note-block.css";
   ```

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
- [ ] No layout shifts or visual bugs
- [ ] Works in both light mode (dark mode can be addressed later)

## Testing

After applying styles:
1. Insert a note block in the editor
2. Verify yellow background and border appear
3. Verify header with icon and "Note" label displays
4. Add multiple paragraphs inside note - verify spacing
5. Check spacing between note blocks and surrounding content

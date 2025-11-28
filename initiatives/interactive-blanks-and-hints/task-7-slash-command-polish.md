# Task 7: Slash Command & Polish

## Objective
Add slash command to insert blanks, optional toolbar button, and final polish (styling, accessibility, edge cases).

## Prerequisites
- All previous tasks (1-6) must be complete

## Files to Modify

### `/packages/editor/src/extensions/SlashCommand.tsx`

Add blank command to items array:

```typescript
import { FormInput } from "lucide-react"; // or appropriate icon

// In the items array, add:
{
  title: "Blank",
  description: "Insert fill-in-the-blank",
  icon: FormInput,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({
        type: "blank",
        attrs: {
          blankIndex: 0,
          correctAnswer: "",
          alternativeAnswers: [],
          hint: null,
          studentAnswer: "",
        },
      })
      .run();
  },
}
```

**Conditional Display:**
- Only show in teacher-editor mode
- Check `editor.storage.editorMode === "teacher-editor"`

### `/packages/editor/src/components/DocumentEditorToolbar.tsx` (Optional)

Add button to toolbar after Exercise button:

```tsx
<button
  onClick={() => {
    editor.chain().focus().insertContent({
      type: "blank",
      attrs: {
        blankIndex: 0,
        correctAnswer: "",
        alternativeAnswers: [],
        hint: null,
        studentAnswer: "",
      },
    }).run();
  }}
  disabled={!editor.can().insertContent({ type: "blank" })}
  title="Insert Blank"
  className="..." // match other toolbar button styles
>
  <FormInput className="h-4 w-4" />
</button>
```

**Only visible in teacher-editor mode**

## Polish Checklist

### Styling
- [ ] All components match design system colors/fonts
- [ ] Consistent spacing and sizing across all modes
- [ ] Focus states are visually clear (borders, backgrounds)
- [ ] Hover states provide feedback
- [ ] Dark mode support (test with dark theme)
- [ ] Icons are appropriately sized (14-16px)
- [ ] Tooltips have consistent styling

### Accessibility
- [ ] All interactive elements have ARIA labels
  - Input: `aria-label="Fill in the blank"`
  - Hint button: `aria-label="Show hint"`
  - Peek button: `aria-label="Show correct answer"`
  - Badge: `aria-label="Edit correct answer"`
- [ ] Keyboard navigation works
  - Tab moves between blanks
  - Enter/Space activates buttons
  - Escape closes tooltips/cancels edits
- [ ] Screen reader announcements
  - "Correct" / "Incorrect" for validation
  - Hint content readable
- [ ] Sufficient color contrast (WCAG AA)
  - Green ✓: #16a34a
  - Red ✗: #dc2626
  - Blue badge: #2563eb
- [ ] Focus visible (outline-offset for buttons)

### Edge Cases
- [ ] Empty correct answer (show placeholder?)
- [ ] Very long student answer (handle overflow)
- [ ] Very long correct answer in badge
- [ ] Very long hint text (wrapping in tooltip)
- [ ] Special characters in answers (quotes, apostrophes)
- [ ] Sentence with 5+ blanks (layout doesn't break)
- [ ] Cursor behavior around blanks (arrow keys)
- [ ] Copy/paste blank nodes
- [ ] Delete blank node (backspace/delete key)
- [ ] Undo/redo operations

### Mobile/Touch
- [ ] Input fields are touch-friendly (min 44x44px tap target)
- [ ] Tooltips work on touch (tap to open, tap outside to close)
- [ ] Badge click works on touch
- [ ] Virtual keyboard doesn't obscure inputs
- [ ] Horizontal scroll if needed on small screens

### Performance
- [ ] No jank when typing (60fps)
- [ ] Real-time sync is fast (<200ms perceived)
- [ ] Many blanks (20+) don't slow down editor
- [ ] React memo/optimization if needed

### Documentation
- [ ] Update CLAUDE.md with new extension info
- [ ] JSDoc comments on main components
- [ ] Type exports in index.ts
- [ ] README for /components/blank/ folder

## Acceptance Criteria
- [ ] Teachers can insert blank via slash command `/blank`
- [ ] Optional: Teachers can insert blank via toolbar button
- [ ] Slash command only appears in teacher-editor mode
- [ ] All styling is consistent and polished
- [ ] Accessibility checklist complete
- [ ] Edge cases handled gracefully
- [ ] Mobile/touch tested and working
- [ ] No performance issues with many blanks
- [ ] Documentation updated
- [ ] No TypeScript errors or console warnings

## Testing Steps

### Slash Command
1. Teacher-editor mode
2. Type `/` in document
3. Type "blank" to filter
4. Press Enter or click command
5. Verify blank inserted with empty correct answer
6. Edit the badge to set correct answer

### Toolbar Button (if implemented)
1. Teacher-editor mode
2. Click blank button in toolbar
3. Verify blank inserted at cursor position

### Keyboard Navigation
1. Document with multiple blanks
2. Tab through all blanks
3. Verify each gets focus in order
4. Shift+Tab goes backwards
5. Enter/Space activates tooltips/badges

### Screen Reader (if available)
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate to blank
3. Verify it announces "Fill in the blank, edit text"
4. Verify validation announces "Correct" or "Incorrect"
5. Verify hint button announces "Show hint"

### Dark Mode
1. Switch to dark theme
2. Verify all components are visible
3. Verify contrast is sufficient
4. Verify tooltips have dark styling

### Mobile (if available)
1. Open on phone/tablet
2. Tap blank input, verify keyboard appears
3. Tap hint icon, verify tooltip appears
4. Tap badge (teacher mode), verify edit works
5. Verify no layout issues

## Final Review
- [ ] Code review with team
- [ ] Manual testing of all modes
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance profiling (React DevTools)
- [ ] No console errors or warnings
- [ ] Git commit messages are clear
- [ ] PR description explains changes

## Notes
- This task completes the initiative
- All 3 modes (student, teacher-lesson, teacher-editor) fully functional
- Hints work, validation works, sync works
- Ready for production use
- Future enhancements can build on this foundation

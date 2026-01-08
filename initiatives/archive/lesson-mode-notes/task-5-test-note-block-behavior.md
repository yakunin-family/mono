# Task 6: Test Note Block Behavior

## Description
Perform comprehensive manual testing to verify all note block functionality works correctly across different modes and scenarios.

## Prerequisites

- [ ] All previous tasks (0-5) completed
- [ ] Editor package built: `pnpm --filter @package/editor build`
- [ ] Teacher app running: `pnpm dev:teacher`
- [ ] Student app running: `pnpm dev:student`
- [ ] Collab server running (if using WebSockets)

## Test Scenarios

### 1. Note Block Creation (Teacher)

**Test in Teacher-Lesson Mode:**
- [ ] Open document in teacher app
- [ ] Switch to lesson mode
- [ ] Verify note button appears in toolbar
- [ ] Click note button
- [ ] Verify note block is inserted at cursor position
- [ ] Verify note has yellow background and left border
- [ ] Verify note header shows "📝 Note" label
- [ ] Verify cursor is inside note block after insertion

**Test in Teacher-Editor Mode:**
- [ ] Switch to editor mode
- [ ] Verify note button still works (or hidden, depending on UX decision)
- [ ] Insert note block
- [ ] Verify it behaves same as lesson mode

### 2. Note Block Editing

**Teacher can edit notes:**
- [ ] Insert a note block
- [ ] Type text inside note
- [ ] Add multiple paragraphs
- [ ] Add lists or other formatted content
- [ ] Verify all content renders correctly

**Student can edit notes:**
- [ ] Open same document in student app
- [ ] Locate existing note block
- [ ] Click inside note
- [ ] Type text
- [ ] Verify text appears and syncs in real-time
- [ ] Verify changes visible to teacher in real-time

### 3. Lesson Mode Read-Only Behavior

**Teacher-Lesson Mode:**
- [ ] Switch to lesson mode
- [ ] Try clicking on main content (paragraphs, headings)
- [ ] Verify main content is not selectable
- [ ] Verify cursor doesn't appear in main content
- [ ] Verify main content has slight opacity (0.9)
- [ ] Click inside note block
- [ ] Verify note is fully editable
- [ ] Try clicking on blank inputs (if any)
- [ ] Verify blanks are editable
- [ ] Try clicking on exercise blocks (if any)
- [ ] Verify exercises are editable

**Student Mode:**
- [ ] Open document in student app
- [ ] Verify student is always in "lesson mode"
- [ ] Verify main content is read-only (same as teacher-lesson)
- [ ] Verify notes are editable
- [ ] Verify blanks/exercises are editable
- [ ] Verify no toolbar button to create new notes

### 4. Note Block Nesting Prevention

**Test nesting prevention:**
- [ ] Create a note block
- [ ] Try to insert another note block inside it
- [ ] Verify second note is inserted after first note (not inside)
- [ ] OR verify insertion is blocked/prevented
- [ ] Confirm `defining: true` prevents nesting

### 5. Collaboration Testing

**Real-time sync:**
- [ ] Open document as teacher (lesson mode)
- [ ] Open same document as student
- [ ] Teacher creates note block
- [ ] Verify student sees note appear in real-time
- [ ] Student types in note
- [ ] Verify teacher sees student's text in real-time
- [ ] Both users type simultaneously
- [ ] Verify no conflicts or data loss
- [ ] Verify Yjs collaboration works correctly

### 6. Visual Design Verification

**Styling checks:**
- [ ] Note blocks have light yellow background (#fffbeb)
- [ ] Note blocks have 4px yellow left border (#fbbf24)
- [ ] Note blocks have rounded corners (0.5rem)
- [ ] Note blocks have subtle shadow
- [ ] Note header displays 📝 icon
- [ ] Note header displays "Note" label in uppercase
- [ ] Spacing between note blocks and content looks balanced
- [ ] Notes are visually distinct from main content

### 7. Mode Switching

**Teacher mode switching:**
- [ ] Start in teacher-editor mode
- [ ] Insert some notes
- [ ] Switch to teacher-lesson mode
- [ ] Verify notes remain editable
- [ ] Verify main content becomes read-only
- [ ] Switch back to teacher-editor mode
- [ ] Verify all content becomes editable again
- [ ] Verify no layout shifts or visual glitches

### 8. Edge Cases

**Empty notes:**
- [ ] Create note with no content (empty paragraph)
- [ ] Verify it displays correctly
- [ ] Verify cursor can be placed inside

**Long content in notes:**
- [ ] Add multiple paragraphs to note
- [ ] Add long text content
- [ ] Verify scrolling works if needed
- [ ] Verify no overflow issues

**Multiple notes:**
- [ ] Create 5+ note blocks in sequence
- [ ] Verify each is independent
- [ ] Verify spacing is consistent
- [ ] Verify no performance issues

**Deleting notes:**
- [ ] Create a note block
- [ ] Select entire note
- [ ] Press Delete/Backspace
- [ ] Verify note is removed cleanly

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

## Performance Testing

- [ ] Document with 20+ note blocks loads quickly
- [ ] No lag when typing in notes
- [ ] Real-time sync has minimal latency
- [ ] No memory leaks (check DevTools)

## Acceptance Criteria

All test scenarios above pass with:
- [ ] No TypeScript errors in console
- [ ] No React errors in console
- [ ] No visual glitches
- [ ] Real-time collaboration works smoothly
- [ ] No data loss or corruption
- [ ] UX feels responsive and intuitive

## Bugs to Watch For

Common issues to check:
- Cursor jumping or focus issues
- Note blocks overlapping or misaligned
- Text selection not working inside notes
- Real-time sync conflicts
- Notes not preventing nesting correctly
- Read-only mode not working consistently
- Styling issues with nested content (lists, etc.)
- Toolbar button appearing in wrong modes

## Documentation

After testing passes:
- [ ] Document any known issues or limitations
- [ ] Note any browser-specific quirks
- [ ] Update README if needed with usage instructions
- [ ] Consider adding screenshots to initiative README

## Sign-Off

Testing completed by: __________
Date: __________
All critical scenarios pass: ☐ Yes ☐ No
Ready for production: ☐ Yes ☐ No

If "No", list blocking issues:
1.
2.
3.

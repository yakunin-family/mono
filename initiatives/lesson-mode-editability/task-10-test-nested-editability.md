# Task 10: Test Nested Editability

## Description
Perform comprehensive testing of the nested `contentEditable` system across all modes, node types, and edge cases to ensure lesson mode editability works correctly.

## Prerequisites

- [ ] All tasks 0-9 completed
- [ ] Editor package built: `pnpm --filter @package/editor build`
- [ ] Teacher app running: `pnpm dev:teacher`
- [ ] Student app running: `pnpm dev:student`
- [ ] Collab server running (for real-time sync testing)

## Test Matrix

### Mode Testing

Test each mode thoroughly:

| Mode               | Expected Behavior                                |
|--------------------|--------------------------------------------------|
| teacher-editor     | All content editable                             |
| teacher-lesson     | Only interactive elements editable               |
| student            | Only interactive elements editable (same as teacher-lesson) |

## Test Scenarios

### 1. Basic Node Editability

**Teacher-Editor Mode:**

- [ ] Can type in paragraphs
- [ ] Can type in headings (h1-h6)
- [ ] Can create and edit bullet lists
- [ ] Can create and edit ordered lists
- [ ] Can create and edit blockquotes
- [ ] Can create and edit code blocks
- [ ] All formatting options work
- [ ] Undo/redo works

**Teacher-Lesson Mode:**

- [ ] Cannot type in paragraphs
- [ ] Cannot type in headings
- [ ] Cannot edit lists (structure or content)
- [ ] Cannot edit blockquotes
- [ ] Cannot edit code blocks
- [ ] Cursor doesn't appear in read-only content
- [ ] Can select text for copying
- [ ] Visual feedback shows read-only state (opacity)

**Student Mode:**

- [ ] Same behavior as teacher-lesson mode
- [ ] All main content is read-only
- [ ] Can select and read content
- [ ] Cannot modify structure or text

### 2. Interactive Elements Always Editable

**Blanks (in all modes including lesson):**

- [ ] Can click into blank input
- [ ] Can type in blank
- [ ] Can clear blank
- [ ] Can tab between blanks
- [ ] Blank remains editable even inside read-only paragraph

**Exercises (in all modes including lesson):**

- [ ] Can click into exercise block
- [ ] Can edit exercise content
- [ ] Exercise remains interactive
- [ ] Content inside exercise is editable

**Notes (in all modes including lesson):**

- [ ] Can click into note block
- [ ] Can type in note paragraphs
- [ ] Can add/remove content in notes
- [ ] Can format text inside notes
- [ ] Note remains fully editable

### 3. Nested Editability Scenarios

**Blank inside paragraph:**

```html
<p contenteditable="false">
  Text before <span contenteditable="true">[blank]</span> text after
</p>
```

- [ ] Paragraph text is read-only
- [ ] Blank is editable
- [ ] Can click directly into blank
- [ ] Clicking paragraph text does nothing
- [ ] Blank can receive focus

**Blank inside heading:**

```html
<h2 contenteditable="false">
  Title with <span contenteditable="true">[blank]</span>
</h2>
```

- [ ] Heading text is read-only
- [ ] Blank is editable
- [ ] Works same as paragraph

**Blank inside list item:**

```html
<ul contenteditable="false">
  <li contenteditable="false">
    <p contenteditable="false">
      Item <span contenteditable="true">[blank]</span> text
    </p>
  </li>
</ul>
```

- [ ] List structure is read-only
- [ ] List item text is read-only
- [ ] Blank is editable
- [ ] Can complete fill-in-blank exercise

**Blank inside blockquote:**

```html
<blockquote contenteditable="false">
  <p contenteditable="false">
    "Quote with <span contenteditable="true">[blank]</span>"
  </p>
</blockquote>
```

- [ ] Blockquote is read-only
- [ ] Blank is editable

**Multiple blanks in paragraph:**

```html
<p contenteditable="false">
  <span contenteditable="true">[blank1]</span> and <span contenteditable="true">[blank2]</span>
</p>
```

- [ ] Both blanks are editable
- [ ] Can tab between them
- [ ] Text between them is read-only

### 4. Note Block Content Editability

**Note with various content:**

```html
<div contenteditable="true" data-type="note-block">
  <p>First paragraph</p>
  <ul>
    <li>List item</li>
  </ul>
  <blockquote>Quote</blockquote>
</div>
```

- [ ] All content inside note is editable
- [ ] Can add paragraphs
- [ ] Can create lists
- [ ] Can add blockquotes
- [ ] Formatting works inside notes
- [ ] Content editable in all modes (teacher and student)

**Note inside read-only document:**

Surrounded by read-only paragraphs:

- [ ] Paragraphs before note are read-only
- [ ] Note is fully editable
- [ ] Paragraphs after note are read-only
- [ ] Can click between elements

### 5. Mode Switching

**Switching between modes:**

Starting in teacher-editor:
- [ ] Create content with mix of text and blanks
- [ ] Switch to teacher-lesson
- [ ] Verify main content becomes read-only
- [ ] Verify blanks remain editable
- [ ] Switch back to teacher-editor
- [ ] Verify all content becomes editable again
- [ ] No content lost
- [ ] No layout shifts

**Mode persistence:**
- [ ] Mode change triggers re-render
- [ ] `editor.storage.editorMode` updates
- [ ] NodeViews pick up new mode
- [ ] Visual feedback updates

### 6. Selection and Copying

**In lesson mode:**

- [ ] Can select read-only text with mouse
- [ ] Can select read-only text with keyboard (Shift+Arrow)
- [ ] Can copy selected text (Cmd/Ctrl+C)
- [ ] Can select across multiple paragraphs
- [ ] Cannot paste into read-only content
- [ ] Can paste into interactive elements (blanks, notes)

### 7. Keyboard Navigation

**In lesson mode:**

- [ ] Tab moves focus to next interactive element
- [ ] Shift+Tab moves to previous interactive element
- [ ] Arrow keys don't move cursor in read-only text
- [ ] Arrow keys work inside interactive elements
- [ ] Enter doesn't create new paragraphs in read-only content
- [ ] Enter works in notes/exercises

### 8. Collaboration Testing

**Real-time sync:**

Setup: Teacher in editor mode, student in lesson mode on same document

- [ ] Teacher types in paragraph → student sees it appear
- [ ] Teacher adds blank → student can interact with it
- [ ] Student fills blank → teacher sees the input
- [ ] Teacher creates note → student can edit it
- [ ] Both type in note simultaneously → no conflicts
- [ ] Yjs handles concurrent edits correctly
- [ ] No data loss or corruption

**Mode-specific sync:**

- [ ] Teacher's mode doesn't affect student's view
- [ ] Student always sees lesson mode (even if teacher is in editor mode)
- [ ] Content structure syncs correctly
- [ ] Interactive elements sync in real-time

### 9. Edge Cases

**Empty elements:**
- [ ] Empty paragraphs display correctly
- [ ] Empty headings display correctly
- [ ] Empty lists display correctly
- [ ] Empty notes can be focused

**Long content:**
- [ ] Long paragraphs wrap correctly
- [ ] Long lists scroll if needed
- [ ] Long code blocks preserve whitespace
- [ ] No performance issues with large documents

**Inline formatting:**
- [ ] Bold text in read-only paragraph remains read-only
- [ ] Italic text in read-only paragraph remains read-only
- [ ] Links in read-only content are clickable but not editable
- [ ] Code spans are read-only

**Special characters:**
- [ ] Emoji in read-only content
- [ ] Unicode characters
- [ ] Line breaks (hard breaks)
- [ ] Multiple spaces

**Undo/redo:**
- [ ] Undo works for interactive elements in lesson mode
- [ ] Cannot undo changes to read-only content (shouldn't be possible)
- [ ] Undo/redo works normally in editor mode

### 10. Visual Feedback

**Read-only indicators:**
- [ ] Read-only content has opacity 0.9
- [ ] Interactive elements have opacity 1.0
- [ ] Cursor changes to default on read-only content
- [ ] Cursor is text cursor on interactive elements
- [ ] Hover effects work on read-only content
- [ ] Focus outlines appear on interactive elements

**Mode indicator:**
- [ ] Clear visual distinction between modes
- [ ] Container has correct mode class
- [ ] Styles apply correctly

### 11. Browser Compatibility

Test in all major browsers:

**Chrome/Edge (Chromium):**
- [ ] All scenarios pass
- [ ] contentEditable nesting works
- [ ] Visual feedback correct

**Firefox:**
- [ ] All scenarios pass
- [ ] contentEditable nesting works
- [ ] Visual feedback correct

**Safari:**
- [ ] All scenarios pass
- [ ] contentEditable nesting works
- [ ] Visual feedback correct
- [ ] (Safari sometimes behaves differently with contentEditable)

### 12. Performance Testing

**Load testing:**
- [ ] Document with 50+ paragraphs loads quickly
- [ ] Document with 20+ blanks performs well
- [ ] No lag when switching modes
- [ ] No lag when typing in interactive elements
- [ ] Memory usage is reasonable (check DevTools)

**Real-time performance:**
- [ ] Yjs sync is fast (<100ms latency)
- [ ] Cursor positions sync correctly
- [ ] No jankiness when both users type

## Regression Testing

After all tests pass, verify that existing functionality still works:

- [ ] Document loading
- [ ] Document saving
- [ ] Collaboration features
- [ ] Toolbar functionality
- [ ] Format buttons (bold, italic, etc.)
- [ ] List creation/editing (in editor mode)
- [ ] History (undo/redo)

## Bug Documentation

Document any issues found:

| Issue | Severity | Mode | Steps to Reproduce | Expected | Actual |
|-------|----------|------|-------------------|----------|--------|
|       |          |      |                   |          |        |

Severity levels:
- **Critical:** Blocks core functionality
- **High:** Major feature doesn't work as expected
- **Medium:** Minor issue, workaround exists
- **Low:** Cosmetic or edge case

## Success Criteria

All test scenarios above pass with:
- [ ] No TypeScript errors in console
- [ ] No React errors in console
- [ ] No contentEditable warnings
- [ ] No visual glitches
- [ ] No layout shifts
- [ ] No performance issues
- [ ] No data loss
- [ ] Real-time collaboration works smoothly

## Sign-Off

Testing completed by: __________
Date: __________

**Results:**
- Total tests: ______
- Passed: ______
- Failed: ______

**Ready for production:** ☐ Yes ☐ No

If "No", list blocking issues:
1.
2.
3.

**Notes:**
(Any observations, recommendations, or follow-up items)

## Post-Testing Actions

After testing passes:
- [ ] Update initiative README with completion status
- [ ] Document any known limitations
- [ ] Create follow-up issues for minor bugs
- [ ] Merge to main branch
- [ ] Deploy to staging environment
- [ ] Test in staging with real users
- [ ] Get product owner sign-off

## References

- Browser contentEditable support: https://caniuse.com/contenteditable
- Testing best practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- Yjs testing: https://docs.yjs.dev/api/testing

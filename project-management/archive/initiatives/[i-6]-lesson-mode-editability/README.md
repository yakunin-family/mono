---
status: done
priority: high
description: Implement true read-only behavior for lesson mode using nested contentEditable
tags: [editor, tiptap, not-started]
---

# Lesson Mode Editability via ContentEditable

## Overview

Implement true read-only behavior for lesson mode using nested `contentEditable` attributes. This makes non-interactive content truly non-editable while keeping notes, blanks, and exercises editable—all handled natively by the browser.

**Status: Not Started** - This initiative was deprioritized. The approach is documented but no implementation was done.

## Problem

Currently, the editor lacks proper read-only enforcement in lesson mode. The CSS `pointer-events` approach is a UI-level hack that:
- Can be bypassed programmatically
- Doesn't provide true editability control
- Feels like a workaround rather than a proper solution

## Solution

Use nested `contentEditable` attributes via custom Tiptap NodeViews:

```html
<div contenteditable="true"> <!-- Editor root -->
  <p contenteditable="false">Read-only content</p>
  <p contenteditable="false">
    Text with <span contenteditable="true">[blank]</span> inside
  </p>
  <div contenteditable="true">Editable note</div>
</div>
```

## Tasks

- [t-1] Set Up Editor Mode Storage - Infrastructure for mode-aware extensions
- [t-2] Create LessonParagraph Extension - Mode-aware paragraph with contentEditable
- [t-3] Create LessonHeading Extension - Mode-aware headings (all levels)
- [t-4] Create LessonList Extensions - BulletList, OrderedList, ListItem
- [t-5] Create LessonBlockquote Extension - Mode-aware blockquotes
- [t-6] Create LessonCodeBlock Extension - Mode-aware code blocks
- [t-7] Update Interactive Nodes - Ensure blanks and exercises always editable
- [t-8] Create LessonText Extension - Handle text node editability
- [t-9] Register Lesson Mode Extensions - Replace StarterKit nodes
- [t-10] Add Visual Feedback - Style read-only content with subtle cues
- [t-11] Test Nested Editability - Comprehensive testing across modes

## Key Files (Planned)

**Files to Create:**
- `packages/editor/src/extensions/lesson-mode/LessonParagraph.ts`
- `packages/editor/src/extensions/lesson-mode/LessonHeading.ts`
- `packages/editor/src/extensions/lesson-mode/LessonBulletList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonOrderedList.ts`
- `packages/editor/src/extensions/lesson-mode/LessonListItem.ts`
- `packages/editor/src/extensions/lesson-mode/LessonBlockquote.ts`
- `packages/editor/src/extensions/lesson-mode/LessonCodeBlock.ts`
- `packages/editor/src/extensions/lesson-mode/LessonText.ts`
- `packages/editor/src/extensions/lesson-mode/index.ts`
- `packages/editor/src/styles/lesson-mode.css`

## Architecture Benefits

1. **Native browser behavior** - No fighting against contentEditable
2. **No transaction filtering** - Simpler, more maintainable code
3. **True editability control** - Not bypassable like CSS
4. **Nested editability** - Inline interactive elements work naturally
5. **Clear semantics** - `contentEditable` is standard HTML
6. **Collaboration-friendly** - Document structure unchanged

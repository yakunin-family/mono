# Task 9: Add Visual Feedback

## Description
Add subtle visual styling to indicate read-only content in lesson mode. This provides clear affordance about what can and cannot be edited without being intrusive.

## Files to Create
- `packages/editor/src/styles/lesson-mode.css`

## Files to Modify
- `packages/editor/src/DocumentEditor.tsx` - Import stylesheet, add mode class
- `packages/editor/src/index.ts` or main entry point - Ensure styles are bundled

## Implementation

### Step 1: Create Lesson Mode Stylesheet

Create `packages/editor/src/styles/lesson-mode.css`:

```css
/* Lesson Mode Visual Feedback */

/* Add mode-specific class to editor container */
.document-editor-lesson-mode {
  /* Container-level styles if needed */
}

/* Subtle visual cue for read-only content */
.document-editor-lesson-mode [contenteditable="false"] {
  opacity: 0.9;
  cursor: default;
  user-select: text; /* Still allow text selection for copying */
}

/* Interactive elements remain fully visible */
.document-editor-lesson-mode [contenteditable="true"] {
  opacity: 1;
  cursor: text;
}

/* Hover state for read-only content (optional) */
.document-editor-lesson-mode [contenteditable="false"]:hover {
  /* Slight highlight to indicate it's viewable but not editable */
  background-color: rgba(0, 0, 0, 0.02);
}

/* Don't show hover on interactive elements' parent containers */
.document-editor-lesson-mode [data-type="note-block"]:hover,
.document-editor-lesson-mode [data-type="blank"]:hover,
.document-editor-lesson-mode [data-type="exercise"]:hover {
  background-color: transparent;
}

/* Focus outline for editable elements in lesson mode */
.document-editor-lesson-mode [contenteditable="true"]:focus-within {
  outline: 2px solid #3b82f6; /* Blue outline */
  outline-offset: 2px;
}

/* Remove focus outline from read-only elements */
.document-editor-lesson-mode [contenteditable="false"]:focus {
  outline: none;
}

/* Optional: Add a subtle icon or badge indicating read-only mode */
.document-editor-lesson-mode::before {
  content: "";
  /* Could add a visual indicator that mode is active */
  /* Defer to post-MVP if not needed */
}
```

### Step 2: Add Mode Class to Editor Container

In `packages/editor/src/DocumentEditor.tsx`:

```typescript
import "./styles/lesson-mode.css";

export function DocumentEditor({
  mode,
  // ... other props
}: DocumentEditorProps) {
  // ... editor setup

  // Determine container class based on mode
  const containerClassName = mode === "teacher-editor"
    ? "document-editor document-editor-full-edit"
    : "document-editor document-editor-lesson-mode";

  return (
    <div className={containerClassName}>
      <DocumentEditorToolbar editor={editor} mode={mode} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Step 3: Ensure Styles Are Bundled

Check that CSS is imported and bundled by your build tool (tsup, webpack, vite, etc.).

In `packages/editor/src/index.ts`:

```typescript
// Import styles for bundling
import "./styles/lesson-mode.css";
import "./styles/editor.css"; // Your existing editor styles

// Exports
export { DocumentEditor } from "./DocumentEditor";
export { type EditorMode } from "./extensions/EditorModeStorage";
// ... other exports
```

## Visual Design Principles

### Subtle, Not Intrusive

**Goal:** Indicate read-only without distracting from content.

**Avoid:**
- ❌ Heavy graying out (looks disabled)
- ❌ Overlays or masks
- ❌ Blurred content
- ❌ Strike-through or other aggressive styling

**Prefer:**
- ✅ Slight opacity reduction (0.9)
- ✅ Cursor change (default instead of text)
- ✅ Gentle hover effects
- ✅ Focus outlines on interactive elements

### Accessibility Considerations

1. **Color contrast:** Ensure opacity doesn't reduce contrast below WCAG guidelines
2. **Cursor affordance:** Clear indication of interactivity
3. **Focus indicators:** Visible focus for keyboard navigation
4. **Screen readers:** Consider ARIA attributes (future enhancement)

## Optional Enhancements (Post-MVP)

### 1. Read-Only Badge

Add a small badge indicating lesson mode:

```css
.document-editor-lesson-mode::after {
  content: "Lesson Mode";
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
}
```

### 2. Lock Icon for Read-Only Content

```css
.document-editor-lesson-mode [contenteditable="false"]::before {
  content: "🔒";
  opacity: 0;
  margin-right: 0.25rem;
  transition: opacity 0.2s;
}

.document-editor-lesson-mode [contenteditable="false"]:hover::before {
  opacity: 0.5;
}
```

### 3. Highlight Interactive Elements

```css
.document-editor-lesson-mode [data-type="blank"] {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
```

Defer these to post-MVP unless they're critical for UX.

## Acceptance Criteria

- [ ] `lesson-mode.css` created with visual feedback styles
- [ ] Styles imported in `DocumentEditor.tsx`
- [ ] Mode-specific class applied to container
- [ ] Read-only content has subtle visual cue (opacity 0.9)
- [ ] Interactive elements remain fully visible (opacity 1)
- [ ] Cursor changes appropriately (default vs text)
- [ ] Hover effects work correctly
- [ ] Focus indicators on editable elements
- [ ] Styles are bundled with package
- [ ] No TypeScript errors
- [ ] `pnpm --filter @package/editor build` succeeds

## Testing

### Visual Testing

**Teacher-Editor Mode:**
- [ ] All content has full opacity
- [ ] No special styling applied
- [ ] Cursor is text cursor everywhere
- [ ] No lesson-mode class on container

**Teacher-Lesson Mode:**
- [ ] Main content has slight opacity (0.9)
- [ ] Interactive elements have full opacity (1)
- [ ] Cursor changes to default on read-only content
- [ ] Cursor is text cursor on interactive elements
- [ ] Hover effects work on read-only content
- [ ] Lesson-mode class on container

**Student Mode:**
- [ ] Same visual feedback as teacher-lesson mode
- [ ] Clear distinction between read-only and interactive
- [ ] Focus indicators visible when tabbing through

### Accessibility Testing

- [ ] Color contrast meets WCAG AA (4.5:1 for body text)
- [ ] Keyboard navigation works (Tab through interactive elements)
- [ ] Focus indicators clearly visible
- [ ] Screen reader announces editable vs read-only (test with NVDA/VoiceOver)

### Cross-Browser Testing

- [ ] Chrome/Edge - visual feedback works
- [ ] Firefox - visual feedback works
- [ ] Safari - visual feedback works

## Dark Mode Considerations (Future)

If you implement dark mode later:

```css
/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .document-editor-lesson-mode [contenteditable="false"]:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .document-editor-lesson-mode [contenteditable="true"]:focus-within {
    outline-color: #60a5fa; /* Lighter blue for dark mode */
  }
}
```

## References

- CSS contentEditable selectors: https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
- Opacity and accessibility: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- Focus indicators: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html

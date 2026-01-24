---
status: todo
priority: low
description: Evaluate and potentially implement lazy loading for DocumentEditor component
tags: [performance, bundle-size]
---

# Consider Lazy Loading DocumentEditor

The DocumentEditor is a heavy component (Tiptap + collaborative editing) that's loaded synchronously. Evaluate using React.lazy() for dynamic imports to improve initial page load.

## Problem

The DocumentEditor includes:

- Tiptap core and extensions
- Yjs (CRDT library)
- Hocuspocus client
- Custom extensions (Exercise, Blank, etc.)
- Prosemirror dependencies

This is a significant bundle that's loaded even on pages that don't need the editor.

## Investigation Steps

### 1. Measure Current Impact

Use Vite's bundle analyzer to measure:

```bash
# Add to package.json scripts
"analyze": "vite build --mode production && npx vite-bundle-visualizer"
```

Check:

- Size of editor-related chunks
- What pages load the editor code
- Percentage of total bundle

### 2. Identify Import Points

Find where DocumentEditor is imported:

- Lesson editor route
- Any other routes?

### 3. Evaluate Lazy Loading

If editor is significant (>100KB gzipped) and only used on specific routes:

```typescript
// Current
import { DocumentEditor } from "@package/editor";

// Lazy loaded
const DocumentEditor = lazy(() =>
  import("@package/editor").then(mod => ({ default: mod.DocumentEditor }))
);

// Usage with Suspense
function LessonEditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <DocumentEditor ... />
    </Suspense>
  );
}
```

### 4. Consider Route-Level Code Splitting

TanStack Router may already handle this. Check if lesson editor route is code-split:

```typescript
// Check if route lazy loads its component
export const Route = createFileRoute(
  "/_protected/spaces.$id_.lesson.$lessonId",
)({
  component: lazy(() => import("./LessonEditor")),
});
```

## Decision Criteria

Implement lazy loading if:

- Editor bundle > 100KB gzipped
- Editor is used on < 30% of routes
- Current page load time is noticeably affected

Don't implement if:

- Editor is already code-split by router
- Bundle impact is minimal
- Added complexity outweighs benefits

## Acceptance Criteria

- [ ] Analyze bundle to measure DocumentEditor impact
- [ ] Document findings (size, routes that load it)
- [ ] If significant: implement lazy loading with Suspense
- [ ] If significant: add loading fallback UI (skeleton)
- [ ] If not significant: document decision to not implement
- [ ] Test that editor still works correctly after changes

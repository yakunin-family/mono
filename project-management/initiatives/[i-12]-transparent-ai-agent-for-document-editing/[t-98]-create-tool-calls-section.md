---
status: todo
priority: high
description: Create ToolCallsSection component with status icons and collapse behavior
tags: [ai, editor, streaming]
references: blocked-by:t-90
---

# Create ToolCallsSection component

Create the UI component that displays tool calls with status indicators and collapse/expand behavior.

## Requirements

1. Create `apps/teacher/src/spaces/document-editor/tool-calls-section.tsx`
2. Create/update `apps/teacher/src/spaces/document-editor/assistant-message.tsx`
3. Show tool calls as bullet points with status icons:
   - Spinner for pending
   - Checkmark for success
   - X for error
4. While streaming: always show expanded
5. After done: collapse by default, show "Done (N steps)"
6. Click to expand/collapse completed tool calls

## UI States

**While streaming (always expanded):**

```
+-------------------------------------------+
| ⟳ Checking fill-blanks rules              |
| ○ Editing document                        |
+-------------------------------------------+
```

**After complete (collapsed - default):**

```
+-------------------------------------------+
| > Done (2 steps)                          |
+-------------------------------------------+
```

**After complete (expanded):**

```
+-------------------------------------------+
| v Done (2 steps)                          |
|   ✓ Checking fill-blanks rules            |
|   ✓ Editing document                      |
+-------------------------------------------+
```

## Component Props

```typescript
interface ToolCallsSectionProps {
  toolCalls: ToolCall[];
  isStreaming: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ToolCallItemProps {
  toolCall: ToolCall;
}
```

## Files

- `apps/teacher/src/spaces/document-editor/tool-calls-section.tsx`
- `apps/teacher/src/spaces/document-editor/assistant-message.tsx`

## Acceptance Criteria

- [ ] Tool calls show correct status icons
- [ ] Streaming messages show expanded tool calls
- [ ] Completed messages collapse by default
- [ ] Click toggles expand/collapse
- [ ] "Done (N steps)" shows correct count
- [ ] Smooth transitions between states

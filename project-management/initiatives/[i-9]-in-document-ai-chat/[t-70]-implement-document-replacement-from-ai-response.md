---
status: done
priority: high
description: Apply AI-generated document XML to the Tiptap editor
tags: [editor, teacher-app]
references: blocked-by:t-64, blocked-by:t-69
---

# Implement Document Replacement from AI Response

Implement the frontend logic that takes AI-generated document XML and applies it to the Tiptap editor.

## Implementation Completed

- Created `apps/teacher/src/spaces/document-editor/use-ai-document-edit.ts`:
  - Hook that validates XML via `validateXML()` and applies via `fromXML()`
  - Returns `{success, error}` result
- Created `apps/teacher/src/spaces/document-editor/use-chat.ts`:
  - Manages chat session lifecycle (create/get session)
  - Fetches and maps messages to frontend interface
  - Serializes document to XML via `toXML()` when sending
  - Auto-applies `documentXml` from assistant messages
  - Tracks applied messages to avoid re-applying
- Updated `apps/teacher/src/spaces/document-editor/chat-messages.tsx`:
  - Added `documentXml` and `error` fields to Message interface
- Updated `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`:
  - Replaced simulated chat with real `useChat` hook
  - Added editor readiness tracking for proper ref handling
- Added `Editor` type export from `@package/editor`

## Flow

1. AI response received with `documentXml`
2. Validate XML using `validateXML()` from editor package
3. If valid, apply using `fromXML()`
4. Yjs automatically syncs changes to other collaborators
5. If invalid, show error in chat (don't break document)

## Implementation

### Location

`apps/teacher/src/spaces/document-editor/use-ai-document-edit.ts`

### Hook

```typescript
export function useAIDocumentEdit(editor: Editor | null) {
  const applyAIResponse = useCallback(
    (documentXml: string) => {
      if (!editor) return { success: false, error: "Editor not ready" };

      // Validate first
      const validation = validateXML(documentXml);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Apply changes
      try {
        fromXML(editor, documentXml);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
    [editor],
  );

  return { applyAIResponse };
}
```

## Error Handling

Per [d-5] decision: **Strict error handling for MVP**

- If XML is invalid, reject entirely
- Show clear error message in chat
- Document remains unchanged
- User can try again with different instruction

### Error Display

```tsx
// In chat message component
{
  message.error && (
    <div className="text-destructive">
      Failed to apply changes: {message.error}
    </div>
  );
}
```

## Undo Consideration

Since we're using full document replacement:

- Tiptap's built-in undo should work for single-step undo
- Yjs history also available
- Consider: Add "Revert to before AI edit" button in chat (future enhancement)

## Acceptance Criteria

- [x] Valid XML applies successfully to editor
- [x] Invalid XML rejected with clear error message
- [x] Document unchanged on error
- [x] Changes sync via Yjs to collaborators
- [x] Error displayed in chat UI
- [x] Hook exported for use in chat sidebar

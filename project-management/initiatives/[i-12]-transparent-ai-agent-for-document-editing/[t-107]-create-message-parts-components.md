---
status: todo
priority: high
description: Create components for rendering UIMessage parts (text, tool calls, results)
tags: [editor, frontend]
---

# Create message part rendering components

Create React components for rendering the different parts of UIMessage from Convex Agent Component.

## Requirements

1. Create `message-parts.tsx` with components for each message part type

2. Render `text` parts:
   - Display text content with proper formatting
   - Support markdown if needed

3. Render `toolCall` parts:
   - Show friendly display names for tools:
     - `loadSkill` → "Loading skill: {skillName}"
     - `editDocument` → "Editing document..."
   - Show spinner/indicator while tool is executing

4. Render `toolResult` parts:
   - Show success indicator for successful results
   - Show error message for failed results
   - For editDocument: show "Applied changes" or similar

5. Show streaming indicator:
   - While `message.status === "streaming"`, show typing indicator
   - Smooth transition when streaming completes

## File

- `apps/teacher/src/spaces/document-editor/message-parts.tsx`

## Component Structure

```tsx
interface MessagePartsProps {
  parts: UIMessagePart[];
  status: "streaming" | "complete" | "error";
}

export function MessageParts({ parts, status }: MessagePartsProps) {
  return (
    <>
      {parts.map((part, i) => (
        <MessagePart key={i} part={part} />
      ))}
      {status === "streaming" && <StreamingIndicator />}
    </>
  );
}

function MessagePart({ part }: { part: UIMessagePart }) {
  switch (part.type) {
    case "text":
      return <TextPart text={part.text} />;
    case "toolCall":
      return <ToolCallPart call={part} />;
    case "toolResult":
      return <ToolResultPart result={part} />;
  }
}
```

## Acceptance Criteria

- [ ] Text parts render with proper formatting
- [ ] Tool calls show friendly names and loading state
- [ ] Tool results show success/error status
- [ ] Streaming indicator shows while message is streaming
- [ ] Components are visually consistent with existing chat UI

---
status: todo
priority: high
description: Create edit_document tool with Zod schema and SSE events
tags: [ai, editor, streaming]
---

# Implement edit_document tool

Create the `edit_document` tool that allows the AI to modify document content.

## Requirements

1. Create tool definition in `apps/backend/convex/chat/tools.ts`
2. Define Zod schema for parameters:
   - `documentXml`: Complete document XML wrapped in `<lesson>` tags
   - `summary`: One-sentence summary of changes made
3. Validate XML structure (must start with `<lesson>` and end with `</lesson>`)
4. Send `tool_start` SSE event when tool begins
5. Send `tool_end` SSE event with `documentXml` for frontend to apply
6. Return error if XML validation fails

## Tool Definition

```typescript
edit_document: tool({
  description: "Replace the document content with new XML. Only use when the user has explicitly requested document changes.",
  parameters: z.object({
    documentXml: z.string().describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("One-sentence summary of the changes made"),
  }),
  execute: async ({ documentXml, summary }) => {
    // Validate and return
  },
}),
```

## SSE Events

```
event: tool_start
data: {"id":"tc_1","tool":"edit_document","displayText":"Editing document"}

event: tool_end
data: {"id":"tc_1","status":"success","documentXml":"<lesson>...</lesson>"}
```

## File

`apps/backend/convex/chat/tools.ts`

## Acceptance Criteria

- [ ] Tool has correct Zod schema
- [ ] XML validation works (rejects invalid structure)
- [ ] `tool_start` event is sent when tool begins
- [ ] `tool_end` event includes `documentXml` for frontend
- [ ] Error case returns `status: "error"` with message

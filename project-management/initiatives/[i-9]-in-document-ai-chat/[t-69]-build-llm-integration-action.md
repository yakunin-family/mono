---
status: todo
priority: high
description: Create Convex action that calls LLM with document context and returns edited XML
tags: [backend, convex, ai]
references: blocked-by:t-67, blocked-by:t-64
---

# Build LLM Integration Action

Create a Convex action that calls the LLM with document context and user instruction, returning edited document XML.

## Implementation

### Location

`apps/backend/convex/chat.ts` (action)

### Action

```typescript
export const generateDocumentEdit = action({
  args: {
    sessionId: v.id("chatSessions"),
    userMessageId: v.id("chatMessages"),
    documentXml: v.string(),
    instruction: v.string(),
    conversationHistory: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Build prompt with system instructions, document XML, and user instruction
    // 2. Call LLM (OpenAI/Anthropic)
    // 3. Parse response to extract new document XML
    // 4. Validate XML structure
    // 5. Store assistant message with documentXml
    // 6. Return result
  },
});
```

## Prompt Design

The system prompt should:

- Explain the XML format and available elements
- Instruct AI to return complete document XML
- Provide examples of transformations
- Set expectations for response format

### Prompt Location

`apps/backend/prompts/document-editor/` (compiled via build:prompts)

## LLM Choice

Use existing LLM integration pattern from the codebase. Check what's already configured (OpenAI, Anthropic, etc.).

## Error Handling

- Invalid XML from LLM: Store error in message, don't apply changes
- LLM API error: Store error, allow retry
- Timeout: Handle gracefully with error message

## Acceptance Criteria

- [ ] Action calls LLM with proper context
- [ ] System prompt clearly explains XML format
- [ ] Conversation history included for context
- [ ] Response parsed and validated
- [ ] Assistant message stored with documentXml
- [ ] Errors stored in message record
- [ ] Works with existing LLM provider setup

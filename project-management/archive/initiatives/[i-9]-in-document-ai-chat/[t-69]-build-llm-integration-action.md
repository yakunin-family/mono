---
status: done
priority: high
description: Create Convex action that calls LLM with document context and returns edited XML
tags: [backend, convex, ai]
references: blocked-by:t-67, blocked-by:t-64
---

# Build LLM Integration Action

Create a Convex action that calls the LLM with document context and user instruction, returning edited document XML.

## Implementation Completed

- Created `apps/backend/prompts/document-editor-chat.md` - system prompt with full XML format reference
- Created `apps/backend/convex/validators/chat.ts` - Zod schema for response validation
- Updated `apps/backend/scripts/build-prompts.ts` to register new prompt
- Implemented `generateResponse` internal action in `chat.ts`:
  - Uses `anthropic/claude-3-5-sonnet-20241022` model
  - Builds prompt with document XML, conversation history, and instruction
  - Calls `generateObject` with structured response schema `{explanation, documentXml}`
  - Validates XML has `<lesson>` root element
  - Stores assistant message with documentXml on success
  - Stores error in message on failure

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

- [x] Action calls LLM with proper context
- [x] System prompt clearly explains XML format
- [x] Conversation history included for context
- [x] Response parsed and validated
- [x] Assistant message stored with documentXml
- [x] Errors stored in message record
- [x] Works with existing LLM provider setup

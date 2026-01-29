---
priority: high
description: Redesign AI chat from one-shot document replacement to transparent, tool-based agent using Convex Agent component
tags: [ai, editor, architecture, streaming]
---

# Transparent AI Agent for Document Editing

Redesign the document editor AI chat from a one-shot document replacement system to a transparent, tool-based agent that shows what it's doing, can have conversations, and only modifies documents when appropriate.

## Problem Statement

The current AI chat has several issues:

1. **Always tries to modify the document** - even "test" messages produce full document replacements because the LLM is forced to return `{ explanation, documentXml }` structured output
2. **No visibility into what the AI is doing** - just bouncing dots while waiting, then a result appears
3. **No flexibility** - can't have a conversation, can't ask questions, no tool awareness
4. **Monolithic prompt** - all capabilities (every exercise type, all XML rules) baked into one system prompt

### Current Architecture (to be replaced)

```
User sends message
    -> Backend calls generateObject() with structured schema
    -> LLM MUST return { explanation, documentXml }
    -> Backend stores message, schedules action
    -> Frontend polls every 1s for new messages
    -> Frontend applies documentXml to editor
```

**Key files being deprecated:**

- `apps/backend/convex/chat.ts` - old queries, mutations, generateResponse action
- `apps/backend/convex/validators/chat.ts` - chatResponseSchema
- `apps/backend/prompts/document-editor-chat.md` - monolithic prompt
- `apps/teacher/src/spaces/document-editor/use-chat.ts` - polling-based hook
- Schema tables: `chatSessions`, `chatMessages`

## Goals

1. **Conversational by default** - AI can discuss, ask questions, and only act when needed
2. **Transparent execution** - Show tool calls and progress as they happen
3. **Skill-based architecture** - Load specialized knowledge on demand via `load_skill` tool
4. **Streaming responses** - Progressive display of AI thinking and results
5. **Tool-based document editing** - AI explicitly calls `edit_document` tool only when modification is needed

## Non-Goals (for this initiative)

- User approval flow for tool execution (later)
- Undo/revert mechanism (later)
- File uploads or library search (separate features)
- Multi-document operations

---

## Solution: Convex Agent Component

We use the official **Convex Agent Component** (`@convex-dev/agent`) which provides:

- Built-in streaming via `saveStreamDeltas` with Convex subscriptions
- Tool calling with full Convex context via `createTool`
- Thread/message persistence
- React hooks (`useUIMessages`) for consuming streams
- `UIMessage` type with `parts` array containing `toolCall`, `toolResult`, `text`

### Why Convex Agent vs Custom Implementation

| Aspect           | Custom (Original Plan)      | Convex Agent (New)                             |
| ---------------- | --------------------------- | ---------------------------------------------- |
| Streaming        | HTTP SSE endpoint           | DB-persisted deltas + Convex subscriptions     |
| Messages         | Custom `chatMessages` table | Agent's built-in storage                       |
| Sessions         | `chatSessions` table        | Agent's `threads`                              |
| Frontend hook    | Custom SSE parsing          | `useUIMessages` from `@convex-dev/agent/react` |
| Tool definitions | Custom tool execution       | `createTool` with Convex context               |
| Reliability      | Custom reconnection logic   | Convex handles it                              |

---

## Architecture Overview

```
+-----------------------------------------------------------------------------+
|                              FRONTEND (Teacher App)                          |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |  ChatSidebar                                                          |   |
|  |    +- ChatMessages (renders UIMessage.parts)                          |   |
|  |    |    +- UserMessage                                                |   |
|  |    |    +- AssistantMessage                                           |   |
|  |    |         +- ToolCallParts (from UIMessage.parts)                  |   |
|  |    |         |    +- "Checking fill-blanks rules" (toolCall)          |   |
|  |    |         |    +- "Editing document" (toolCall)                    |   |
|  |    |         +- TextParts (streamed text)                             |   |
|  |    +- ChatInput                                                       |   |
|  +----------------------------------------------------------------------+   |
|                                                                              |
|  Hooks:                                                                      |
|    - useUIMessages(api.chat.listMessages, { threadId }, { stream: true })   |
|    - useMutation(api.chat.sendMessage)                                      |
+-----------------------------------------------------------------------------+
                                      |
                                      | Convex subscriptions (real-time)
                                      v
+-----------------------------------------------------------------------------+
|                              BACKEND (Convex + Agent Component)              |
|                                                                              |
|  Agent Definition (convex/agents/document-editor.ts):                        |
|    const documentEditorAgent = new Agent(components.agent, {                |
|      name: "Document Editor",                                                |
|      chat: openai("gpt-4o-mini"),                                           |
|      instructions: buildChatBasePrompt(),                                    |
|      tools: { loadSkill, editDocument },                                    |
|      maxSteps: 10,                                                          |
|    })                                                                        |
|                                                                              |
|  Actions:                                                                    |
|    - createThread(documentId) -> threadId                                   |
|    - sendMessage(threadId, content, documentXml) -> streams response        |
|                                                                              |
|  Queries:                                                                    |
|    - listMessages(threadId) -> UIMessage[] with streaming support           |
|                                                                              |
|  Tools:                                                                      |
|    - loadSkill(skill) -> Returns skill markdown content                     |
|    - editDocument(xml, summary) -> Validates XML, returns for frontend      |
+-----------------------------------------------------------------------------+
```

## Tools

### `loadSkill`

Loads additional instructions into the conversation context.

```typescript
const loadSkill = createTool({
  description:
    "Load detailed instructions for creating specific types of exercises. Always use this before creating exercises.",
  args: z.object({
    skill: z
      .enum([
        "fill-blanks",
        "multiple-choice",
        "true-false",
        "sequencing",
        "short-answer",
        "writing-exercises",
      ])
      .describe("The skill to load"),
  }),
  handler: async (
    ctx,
    { skill },
  ): Promise<{ success: boolean; instructions: string }> => {
    const content = SKILLS[skill](); // From generated prompts
    return { success: true, instructions: content };
  },
});
```

**User sees:** "Checking fill-blanks rules"

### `editDocument`

Applies XML changes to the document.

```typescript
const editDocument = createTool({
  description:
    "Replace the document content with new XML. Only use when user explicitly requests changes.",
  args: z.object({
    documentXml: z
      .string()
      .describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("One-sentence summary of changes"),
  }),
  handler: async (
    ctx,
    { documentXml, summary },
  ): Promise<{ success: boolean; documentXml?: string; error?: string }> => {
    const trimmed = documentXml.trim();
    if (!trimmed.startsWith("<lesson>") || !trimmed.endsWith("</lesson>")) {
      return {
        success: false,
        error: "Document must be wrapped in <lesson> tags",
      };
    }
    return { success: true, documentXml, summary };
  },
});
```

**User sees:** "Editing document"

**Frontend behavior:** When `toolResult` with `editDocument` arrives, apply `documentXml` to the editor.

---

## Skills System

Skills are **markdown files** compiled at build time via `build-prompts.ts`.

### Directory Structure

```
apps/backend/prompts/
  chat/
    base.md                    # Base system prompt
    skills/
      fill-blanks.md           # Fill-in-the-blank exercise rules
      multiple-choice.md       # Multiple choice rules
      true-false.md            # True/false rules
      sequencing.md            # Sequencing rules
      short-answer.md          # Short answer rules
      writing-exercises.md     # Writing exercise rules
```

### Base Prompt (`prompts/chat/base.md`)

```markdown
# Document Editor Assistant

You are an AI assistant helping language teachers create educational documents.

## Your Capabilities

You have access to these tools:

- **loadSkill**: Load detailed instructions for specialized tasks (exercise creation, etc.). Always use this before creating exercises.
- **editDocument**: Modify the document content. Only use when the user explicitly requests changes.

## When to Use Tools

- **Conversation**: If the user is asking questions or chatting, just respond conversationally. Don't call any tools.
- **Document editing**: If the user wants to modify the document, use `editDocument`.
- **Exercises**: If creating exercises, ALWAYS call `loadSkill` first to get the correct format.

## XML Format Quick Reference

The document uses XML format with these elements:

- `<lesson>` - Root element (required)
- `<h1>`, `<h2>`, `<h3>` - Headings
- `<p>` - Paragraphs
- `<exercise id="...">` - Exercise container
- `<blank answer="..." hint="..." student-answer="" />` - Fill-in-the-blank
- `<writing-area id="..." lines="..." placeholder="...">` - Student writing space
- `<note>` - Teacher-only notes

For detailed exercise creation rules, use `loadSkill` first.

## Important Rules

1. Be conversational and helpful
2. Only modify the document when explicitly asked
3. When creating exercises, ALWAYS load the relevant skill first
4. Preserve existing element IDs when editing
5. Keep responses concise
```

---

## Data Model

### Thread-Document Relationship

A single document can have multiple threads (chat sessions). We store threads via the Agent component and track document association.

```typescript
// Option: Store threadId references in a separate table or on each thread's metadata
// The Agent component handles thread/message storage internally
```

### UIMessage Structure (from Agent component)

```typescript
interface UIMessage {
  key: string;
  role: "user" | "assistant" | "system";
  parts: UIMessagePart[];  // text, toolCall, toolResult, file, etc.
  text: string;            // Convenience: combined text content
  status: "streaming" | "finished" | "aborted";
  agentName?: string;
  order: number;
  stepOrder: number;
  _creationTime: number;
}

type UIMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolName: string; args: unknown; toolCallId: string }
  | { type: "tool-result"; toolName: string; result: unknown; toolCallId: string }
  | { type: "file"; ... }
  // etc.
```

---

## Frontend Implementation

### Hook: `useDocumentChat`

```typescript
// apps/teacher/src/spaces/document-editor/use-document-chat.ts

import { useUIMessages } from "@convex-dev/agent/react";
import { useMutation } from "convex/react";
import { api } from "@app/backend";
import { toXML, fromXML, type Editor } from "@package/editor";
import { useEffect, useRef } from "react";

export function useDocumentChat(
  threadId: string | null,
  editor: Editor | null,
) {
  const appliedResults = useRef<Set<string>>(new Set());

  const { results, status, loadMore } = useUIMessages(
    api.chat.listMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const sendMessageMutation = useMutation(api.chat.sendMessage);

  const sendMessage = async (content: string) => {
    if (!threadId || !editor) return;
    const documentXml = toXML(editor);
    await sendMessageMutation({ threadId, content, documentXml });
  };

  // Watch for editDocument tool results and apply to editor
  useEffect(() => {
    if (!editor) return;

    for (const message of results) {
      for (const part of message.parts) {
        if (
          part.type === "tool-result" &&
          part.toolName === "editDocument" &&
          !appliedResults.current.has(part.toolCallId)
        ) {
          const result = part.result as {
            success: boolean;
            documentXml?: string;
          };
          if (result.success && result.documentXml) {
            appliedResults.current.add(part.toolCallId);
            fromXML(editor, result.documentXml);
          }
        }
      }
    }
  }, [results, editor]);

  return {
    messages: results,
    isStreaming: status === "LoadingMore", // or check message.status
    sendMessage,
    loadMore,
  };
}
```

### Message Rendering

```typescript
// apps/teacher/src/spaces/document-editor/message-parts.tsx

import type { UIMessage } from "@convex-dev/agent";

function AssistantMessage({ message }: { message: UIMessage }) {
  const toolParts = message.parts.filter(
    (p) => p.type === "tool-call" || p.type === "tool-result"
  );
  const textParts = message.parts.filter((p) => p.type === "text");
  const isStreaming = message.status === "streaming";

  return (
    <div className="flex flex-col gap-2">
      {toolParts.length > 0 && (
        <ToolCallsSection parts={toolParts} isStreaming={isStreaming} />
      )}
      {textParts.length > 0 && (
        <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
          {textParts.map((p, i) => p.type === "text" && <span key={i}>{p.text}</span>)}
          {isStreaming && <span className="animate-pulse">|</span>}
        </div>
      )}
    </div>
  );
}
```

---

## Example Interaction Flows

### Flow 1: Simple conversation (no tools)

**User:** "test"

```
Agent thinks: This is just a test message, no document changes needed
Agent responds: "Hi! I'm here to help you edit your document. What would you like to do?"
```

**UIMessage.parts:**

```json
[{ "type": "text", "text": "Hi! I'm here to help..." }]
```

### Flow 2: Create exercise (with tools)

**User:** "Add a fill-in-the-blank exercise about French verbs"

```
Agent calls: loadSkill({ skill: "fill-blanks" })
Tool returns: { success: true, instructions: "# Fill-in-the-Blank Rules..." }

Agent calls: editDocument({ documentXml: "<lesson>...", summary: "Added French verb exercise" })
Tool returns: { success: true, documentXml: "..." }

Agent responds: "I've added a fill-in-the-blank exercise with 5 sentences."
```

**UIMessage.parts:**

```json
[
  { "type": "tool-call", "toolName": "loadSkill", "args": { "skill": "fill-blanks" }, "toolCallId": "tc1" },
  { "type": "tool-result", "toolName": "loadSkill", "result": { "success": true }, "toolCallId": "tc1" },
  { "type": "tool-call", "toolName": "editDocument", "args": { ... }, "toolCallId": "tc2" },
  { "type": "tool-result", "toolName": "editDocument", "result": { "success": true, "documentXml": "..." }, "toolCallId": "tc2" },
  { "type": "text", "text": "I've added a fill-in-the-blank exercise..." }
]
```

---

## File Structure

```
apps/backend/
  convex/
    convex.config.ts           # NEW: Agent component setup
    agents/
      document-editor.ts       # NEW: Agent definition + tools
    chat.ts                    # REPLACE: New Agent-based actions/queries
  prompts/
    chat/
      base.md                  # NEW: Base system prompt
      skills/
        fill-blanks.md         # NEW
        multiple-choice.md     # NEW
        true-false.md          # NEW
        sequencing.md          # NEW
        short-answer.md        # NEW
        writing-exercises.md   # NEW
  scripts/
    build-prompts.ts           # UPDATE: Add skill file processing

apps/teacher/
  src/spaces/document-editor/
    use-document-chat.ts       # NEW: Hook using Agent
    message-parts.tsx          # NEW: Render UIMessage parts
    chat-messages.tsx          # UPDATE: Use new message format
    chat-sidebar.tsx           # UPDATE: Wire up new hook
```

**Deprecated (to be removed):**

```
apps/backend/convex/validators/chat.ts
apps/backend/prompts/document-editor-chat.md
apps/teacher/src/spaces/document-editor/use-chat.ts
apps/teacher/src/spaces/document-editor/use-ai-document-edit.ts
```

---

## Implementation Phases

### Phase 1: Agent Component Setup

1. Install `@convex-dev/agent` and configure in `convex.config.ts`
2. Create base prompt and skill markdown files
3. Update `build-prompts.ts` to generate skill functions
4. Define document editor agent with tools

### Phase 2: Backend Integration

5. Create actions: `createThread`, `sendMessage`
6. Create query: `listMessages` with streaming support
7. Implement thread-document association

### Phase 3: Frontend Integration

8. Create `useDocumentChat` hook
9. Create message part components (tool calls, text)
10. Wire up to existing chat sidebar
11. Apply document XML from tool results

### Phase 4: Polish

12. Collapse/expand for completed tool calls
13. Error handling and display
14. Remove deprecated code

---

## Configuration

### Model

Using Vercel AI SDK's model router:

```typescript


// In agent definition
chat: openai("gpt-4o-mini"),
```

### Agent Settings

```typescript
const documentEditorAgent = new Agent(components.agent, {
  name: "Document Editor",
  chat: openai("gpt-4o-mini"),
  instructions: buildChatBasePrompt(),
  tools: { loadSkill, editDocument },
  maxSteps: 10, // Max tool call rounds
});
```

---

## Success Criteria

1. **Conversational:** Typing "test" or "hello" gets a friendly response without document changes
2. **Transparent:** Creating an exercise shows tool calls as they happen
3. **Streaming:** Response text appears progressively via Convex subscriptions
4. **Collapsible:** Completed tool calls can be collapsed
5. **Reliable:** Real-time updates via Convex, not polling

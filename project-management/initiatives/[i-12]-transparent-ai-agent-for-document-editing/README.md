---
priority: high
description: Redesign AI chat from one-shot document replacement to transparent, tool-based agent
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

**Key files being replaced:**

- `apps/backend/convex/chat.ts` - queries, mutations, generateResponse action
- `apps/backend/convex/validators/chat.ts` - chatResponseSchema
- `apps/backend/prompts/document-editor-chat.md` - monolithic prompt
- `apps/teacher/src/spaces/document-editor/use-chat.ts` - polling-based hook
- `apps/teacher/src/spaces/document-editor/chat-messages.tsx` - simple message display

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

## Architecture Overview

```
+-----------------------------------------------------------------------------+
|                              FRONTEND (Teacher App)                          |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |  ChatSidebar                                                          |   |
|  |    +- ChatMessages                                                    |   |
|  |    |    +- UserMessage (simple bubble)                                |   |
|  |    |    +- AssistantMessage                                           |   |
|  |    |         +- ToolCallsSection                                      |   |
|  |    |         |    +- ToolCallItem ("Checking fill-blanks rules")      |   |
|  |    |         |    +- ToolCallItem ("Editing document")                |   |
|  |    |         |    +- CollapsedSummary ("Done 2 steps") [when done]    |   |
|  |    |         +- ResponseText (streamed markdown)                      |   |
|  |    +- ChatInput                                                       |   |
|  +----------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
                                      |
                                      | HTTP POST + SSE streaming
                                      v
+-----------------------------------------------------------------------------+
|                              BACKEND (Convex)                                |
|                                                                              |
|  HTTP Action: POST /api/chat/stream                                          |
|    +- Authenticate user (via session token)                                  |
|    +- Validate document access                                               |
|    +- Load conversation history (last 20 messages)                           |
|    +- Build system prompt (base prompt only)                                 |
|    +- Call LLM with streamText() + tools                                     |
|    |    +- Stream text chunks -> SSE "text" events                           |
|    |    +- Tool calls -> execute, stream "tool_start"/"tool_end"             |
|    |    +- Agent loop continues until no more tool calls                     |
|    +- Persist final message to DB (via internal mutation)                    |
|    +- Send SSE "done" event                                                  |
|                                                                              |
|  Tools executed by LLM:                                                      |
|    +- load_skill(skillName) -> Appends skill content to context              |
|    +- edit_document(xml) -> Validates XML, returns success/error             |
+-----------------------------------------------------------------------------+
```

## Agent Loop

The AI operates in an **agentic loop**: it can call tools, observe results, and continue reasoning until it decides to respond to the user.

```
User message arrives
         |
         v
+------------------+
|  LLM Reasoning   |<-----------------------+
+--------+---------+                        |
         |                                  |
         v                                  |
    Tool call?                              |
    +----+----+                             |
   Yes       No                             |
    |         |                             |
    v         v                             |
Execute    Stream                           |
  tool     response                         |
    |         |                             |
    v         v                             |
Stream     Done                             |
"tool_start"                                |
"tool_end"                                  |
    |                                       |
    +---------------------------------------+
         (tool result added to context)
```

**Vercel AI SDK implements this via `maxSteps`:**

```typescript
const result = streamText({
  model: openai("gpt-4o-mini"),
  messages,
  tools,
  maxSteps: 10, // Allow up to 10 tool call rounds
});
```

---

## Tools

### `load_skill`

Loads additional instructions into the conversation context.

```typescript
load_skill: tool({
  description: "Load specialized instructions for a specific task. Use this when you need detailed rules for creating exercises or other specialized content.",
  parameters: z.object({
    skill: z.enum([
      "fill-blanks",
      "multiple-choice",
      "true-false",
      "sequencing",
      "short-answer",
      "writing-exercises",
    ]).describe("The skill to load"),
  }),
  execute: async ({ skill }) => {
    const content = await loadSkillContent(skill);
    return {
      success: true,
      instructions: content
    };
  },
}),
```

**User sees:** "Checking fill-blanks rules"

**What happens:** The skill's markdown content is returned as the tool result, which becomes part of the conversation context for the LLM's next reasoning step.

### `edit_document`

Applies XML changes to the document.

```typescript
edit_document: tool({
  description: "Replace the document content with new XML. Only use this when the user has requested changes to the document.",
  parameters: z.object({
    documentXml: z.string().describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("Brief description of what changed (1 sentence)"),
  }),
  execute: async ({ documentXml, summary }) => {
    // Validate XML structure
    if (!documentXml.trim().startsWith("<lesson>") ||
        !documentXml.trim().endsWith("</lesson>")) {
      return {
        success: false,
        error: "Document must be wrapped in <lesson> tags"
      };
    }

    // Additional XML validation could go here

    return {
      success: true,
      summary,
      documentXml, // Passed back to frontend via stream
    };
  },
}),
```

**User sees:** "Editing document"

**What happens:**

1. Backend validates the XML
2. Streams `tool_start` and `tool_end` events with the documentXml
3. Frontend immediately applies the XML to the editor
4. Yjs syncs to other collaborators

---

## Skills System

Skills are **markdown files** containing specialized instructions. They live in `apps/backend/prompts/chat/skills/`.

### Base Prompt (`prompts/chat/base.md`)

Minimal prompt that explains:

- Who the AI is (document editing assistant for teachers)
- Available tools and when to use them
- Basic XML element names (not full specs)
- Behavioral rules (be conversational, only edit when asked)

```markdown
# Document Editor Assistant

You are an AI assistant helping language teachers create educational documents.

## Your Capabilities

You have access to these tools:

- **load_skill**: Load detailed instructions for specialized tasks (exercise creation, etc.)
- **edit_document**: Modify the document content

## When to Use Tools

- **Conversation**: If the user is asking questions, chatting, or doesn't need document changes, just respond conversationally. Don't call any tools.
- **Document editing**: If the user wants to modify the document, use `edit_document`.
- **Specialized content**: If creating exercises or complex content, first use `load_skill` to get the detailed rules.

## XML Format (Quick Reference)

The document uses XML format. Basic elements:

- `<lesson>` - Root element (required)
- `<h1>`, `<h2>`, `<h3>` - Headings
- `<p>` - Paragraphs
- `<exercise>` - Exercise container
- `<blank>` - Fill-in-the-blank (inline)
- `<writing-area>` - Student writing space
- `<note>` - Teacher-only notes

For detailed exercise creation rules, use `load_skill` first.

## Important Rules

1. Be conversational and helpful
2. Only modify the document when explicitly asked
3. When creating exercises, ALWAYS load the relevant skill first
4. Preserve existing element IDs when editing
5. Keep responses concise
```

### Skill Example (`prompts/chat/skills/fill-blanks.md`)

```markdown
# Fill-in-the-Blank Exercise Rules

## XML Structure

Fill-in-the-blank exercises use the `<blank>` element inside paragraphs:

\`\`\`xml
<exercise id="ex-123">

  <h3>Complete the sentences</h3>
  <p>The cat <blank answer="sleeps" hint="present tense verb" student-answer="" /> on the sofa.</p>
  <p>She <blank answer="went" alts="traveled,drove" student-answer="" /> to Paris last summer.</p>
</exercise>
\`\`\`

## Blank Attributes

- `answer` (required): The correct answer
- `alts` (optional): Comma-separated alternative correct answers
- `hint` (optional): Hint shown to students
- `student-answer`: Always set to empty string "" for new blanks

## Guidelines

1. **Context**: Ensure surrounding text provides enough context to determine the answer
2. **Difficulty**: Match blanks to the specified CEFR level
3. **Variety**: Mix grammar points when appropriate
4. **Hints**: Provide hints for harder blanks (grammar category, first letter, etc.)

## Common Mistakes to Avoid

- Don't create blanks where multiple unrelated answers could be correct
- Don't put blanks at the very start of a sentence (no context)
- Don't forget the `student-answer=""` attribute
```

### Available Skills

| Skill Name          | File                   | Content                                            |
| ------------------- | ---------------------- | -------------------------------------------------- |
| `fill-blanks`       | `fill-blanks.md`       | Fill-in-the-blank XML format, guidelines, examples |
| `multiple-choice`   | `multiple-choice.md`   | Multiple choice structure, distractor guidelines   |
| `true-false`        | `true-false.md`        | True/false statement guidelines                    |
| `sequencing`        | `sequencing.md`        | Ordering exercise format                           |
| `short-answer`      | `short-answer.md`      | Open-ended questions with rubrics                  |
| `writing-exercises` | `writing-exercises.md` | Writing prompts, word counts, assessment           |

---

## Streaming Protocol

### HTTP Endpoint

```
POST /api/chat/stream
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "sessionId": "j57...",       // Chat session ID
  "content": "Add a fill...",  // User message
  "documentXml": "<lesson>..." // Current document state
}
```

### Response: Server-Sent Events (SSE)

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event Types

```typescript
// Tool execution started
event: tool_start
data: {"id":"tc_1","tool":"load_skill","args":{"skill":"fill-blanks"},"displayText":"Checking fill-blanks rules"}

// Tool execution completed
event: tool_end
data: {"id":"tc_1","status":"success"}

// Tool execution with document edit (special case)
event: tool_end
data: {"id":"tc_2","status":"success","documentXml":"<lesson>...</lesson>"}

// Streamed response text (may be many of these)
event: text
data: {"content":"I've added"}

event: text
data: {"content":" a fill-in-the-blank exercise"}

event: text
data: {"content":" about verb conjugation."}

// Stream complete
event: done
data: {"messageId":"msg_abc123"}

// Error (fatal)
event: error
data: {"message":"Failed to generate response","code":"LLM_ERROR"}
```

### Display Text Mapping

Tool calls are shown to users with friendly labels:

| Tool            | Args                         | Display Text                     |
| --------------- | ---------------------------- | -------------------------------- |
| `load_skill`    | `{skill: "fill-blanks"}`     | "Checking fill-blanks rules"     |
| `load_skill`    | `{skill: "multiple-choice"}` | "Checking multiple-choice rules" |
| `edit_document` | `*`                          | "Editing document"               |

---

## Data Model

### Updated Schema

```typescript
// apps/backend/convex/schema.ts

// Keep existing chatSessions table unchanged

chatMessages: defineTable({
  sessionId: v.id("chatSessions"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  createdAt: v.number(),

  // User messages
  content: v.optional(v.string()),

  // Assistant messages
  response: v.optional(v.object({
    // Final response text
    text: v.string(),

    // Tool calls made during this response
    toolCalls: v.array(v.object({
      id: v.string(),
      tool: v.string(),
      args: v.any(),
      displayText: v.string(),
      status: v.union(v.literal("success"), v.literal("error")),
      error: v.optional(v.string()),
    })),

    // Final document state (if edit_document was called)
    documentXml: v.optional(v.string()),
  })),

  // Error state (if entire response failed)
  error: v.optional(v.string()),

  // Model used
  model: v.optional(v.string()),
})
.index("by_session_created", ["sessionId", "createdAt"]),
```

### Message Examples

**User message:**

```json
{
  "_id": "msg_user_1",
  "sessionId": "ses_123",
  "role": "user",
  "content": "Add a fill-in-the-blank exercise about past tense verbs",
  "createdAt": 1704067200000
}
```

**Assistant message (with tool calls):**

```json
{
  "_id": "msg_asst_1",
  "sessionId": "ses_123",
  "role": "assistant",
  "response": {
    "text": "I've added a fill-in-the-blank exercise with 5 sentences practicing regular and irregular past tense verbs.",
    "toolCalls": [
      {
        "id": "tc_1",
        "tool": "load_skill",
        "args": { "skill": "fill-blanks" },
        "displayText": "Checking fill-blanks rules",
        "status": "success"
      },
      {
        "id": "tc_2",
        "tool": "edit_document",
        "args": { "summary": "Added past tense fill-in-the-blank exercise" },
        "displayText": "Editing document",
        "status": "success"
      }
    ],
    "documentXml": "<lesson>...</lesson>"
  },
  "model": "gpt-4o-mini",
  "createdAt": 1704067205000
}
```

**Assistant message (conversational, no tools):**

```json
{
  "_id": "msg_asst_2",
  "sessionId": "ses_123",
  "role": "assistant",
  "response": {
    "text": "I can help you create several types of exercises:\n\n- **Fill-in-the-blank**: Students complete sentences with missing words\n- **Multiple choice**: Questions with 4 options\n- **True/false**: Evaluate statements\n\nWhat would you like to create?",
    "toolCalls": []
  },
  "model": "gpt-4o-mini",
  "createdAt": 1704067210000
}
```

---

## Frontend Implementation

### Hook: `useStreamingChat`

Replaces `use-chat.ts` with streaming support.

```typescript
// apps/teacher/src/spaces/document-editor/use-streaming-chat.ts

interface StreamingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCall[];
  isStreaming: boolean;
  documentXml?: string;
  error?: string;
}

interface ToolCall {
  id: string;
  tool: string;
  displayText: string;
  status: "pending" | "success" | "error";
}

function useStreamingChat(sessionId: string, editor: Editor) {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load initial messages from Convex
  const storedMessages = useQuery(api.chat.getSessionMessages, { sessionId });

  const sendMessage = async (content: string) => {
    const documentXml = toXML(editor);

    // Add user message optimistically
    const userMsg = { id: crypto.randomUUID(), role: "user", content, ... };
    setMessages(prev => [...prev, userMsg]);

    // Start streaming
    setIsStreaming(true);
    const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: "", toolCalls: [], isStreaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    // Connect to SSE endpoint
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, content, documentXml }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // Process SSE events
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const events = parseSSE(chunk);

      for (const event of events) {
        switch (event.type) {
          case "tool_start":
            // Add pending tool call
            setPendingToolCalls(prev => [...prev, {
              id: event.data.id,
              tool: event.data.tool,
              displayText: event.data.displayText,
              status: "pending",
            }]);
            break;

          case "tool_end":
            // Update tool call status
            setPendingToolCalls(prev =>
              prev.map(tc => tc.id === event.data.id
                ? { ...tc, status: event.data.status }
                : tc
              )
            );
            // Apply document changes immediately
            if (event.data.documentXml) {
              fromXML(editor, event.data.documentXml);
            }
            break;

          case "text":
            // Append to assistant message
            setMessages(prev => {
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), {
                ...last,
                content: last.content + event.data.content,
              }];
            });
            break;

          case "done":
            setIsStreaming(false);
            // Move pending tool calls to message
            setMessages(prev => {
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), {
                ...last,
                isStreaming: false,
                toolCalls: pendingToolCalls,
              }];
            });
            setPendingToolCalls([]);
            break;

          case "error":
            setIsStreaming(false);
            // Show error in message
            break;
        }
      }
    }
  };

  return { messages, pendingToolCalls, isStreaming, sendMessage };
}
```

### Component: `AssistantMessage`

```typescript
// apps/teacher/src/spaces/document-editor/assistant-message.tsx

interface AssistantMessageProps {
  message: StreamingMessage;
  pendingToolCalls?: ToolCall[]; // Only for actively streaming message
}

function AssistantMessage({ message, pendingToolCalls }: AssistantMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toolCalls = message.isStreaming ? pendingToolCalls : message.toolCalls;
  const hasToolCalls = toolCalls && toolCalls.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Tool calls section */}
      {hasToolCalls && (
        <ToolCallsSection
          toolCalls={toolCalls}
          isStreaming={message.isStreaming}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />
      )}

      {/* Response text */}
      {message.content && (
        <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
          <Markdown>{message.content}</Markdown>
          {message.isStreaming && <span className="animate-pulse">|</span>}
        </div>
      )}
    </div>
  );
}
```

### Component: `ToolCallsSection`

```typescript
// apps/teacher/src/spaces/document-editor/tool-calls-section.tsx

function ToolCallsSection({ toolCalls, isStreaming, isExpanded, onToggle }) {
  // While streaming: always show expanded
  // After done: show collapsed by default, expandable

  if (isStreaming) {
    return (
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {toolCalls.map(tc => (
          <ToolCallItem key={tc.id} toolCall={tc} />
        ))}
      </div>
    );
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-3 w-3" />
        <span>Done ({toolCalls.length} steps)</span>
      </button>
    );
  }

  // Expanded state
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-3 w-3" />
        <span>Done ({toolCalls.length} steps)</span>
      </button>
      <div className="ml-4 flex flex-col gap-1 text-sm text-muted-foreground">
        {toolCalls.map(tc => (
          <ToolCallItem key={tc.id} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-center gap-2">
      {toolCall.status === "pending" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {toolCall.status === "success" && (
        <Check className="h-3 w-3 text-green-500" />
      )}
      {toolCall.status === "error" && (
        <X className="h-3 w-3 text-red-500" />
      )}
      <span>{toolCall.displayText}</span>
    </div>
  );
}
```

### UI States

**While AI is working (tool calls in progress):**

```
+-------------------------------------------+
| * Checking fill-blanks rules              |
| o Editing document                        |  <- spinner on pending
+-------------------------------------------+
```

**After AI responds (collapsed):**

```
+-------------------------------------------+
| > Done (2 steps)                          |  <- clickable to expand
+-------------------------------------------+
| I've added a fill-in-the-blank exercise   |
| about verb conjugations to your document. |
+-------------------------------------------+
```

**After AI responds (expanded):**

```
+-------------------------------------------+
| v Done (2 steps)                          |
|   * Checking fill-blanks rules            |
|   * Editing document                      |
+-------------------------------------------+
| I've added a fill-in-the-blank exercise   |
| about verb conjugations to your document. |
+-------------------------------------------+
```

---

## Example Interaction Flows

### Flow 1: Simple conversation (no tools)

**User:** "test"

```
LLM thinks: This is just a test message, no document changes needed
LLM responds: "Hi! I'm here to help you edit your document. What would you like to do?"
```

**Stream events:**

```
event: text
data: {"content":"Hi! I'm here to help"}

event: text
data: {"content":" you edit your document. What would you like to do?"}

event: done
data: {"messageId":"msg_123"}
```

**UI:** Just the response text, no tool calls section.

### Flow 2: Question about capabilities (no tools)

**User:** "What types of exercises can you create?"

```
LLM thinks: This is a question, just answer it
LLM responds: "I can help you create several types of exercises:
- Fill-in-the-blank
- Multiple choice
- True/false
- Sequencing
- Short answer
- Writing prompts

Would you like me to create one?"
```

**Stream events:** Just `text` events and `done`.

### Flow 3: Create exercise (with tools)

**User:** "Add a fill-in-the-blank exercise about French verbs"

```
LLM thinks: User wants an exercise, I need the fill-blanks rules
LLM calls: load_skill("fill-blanks")
Tool returns: { success: true, instructions: "# Fill-in-the-Blank Rules..." }

LLM thinks: Now I know the format, let me create the exercise
LLM calls: edit_document({ documentXml: "<lesson>...", summary: "Added French verb exercise" })
Tool returns: { success: true, summary: "Added French verb exercise" }

LLM responds: "I've added a fill-in-the-blank exercise with 5 sentences practicing French verb conjugation in the present tense."
```

**Stream events:**

```
event: tool_start
data: {"id":"tc_1","tool":"load_skill","displayText":"Checking fill-blanks rules"}

event: tool_end
data: {"id":"tc_1","status":"success"}

event: tool_start
data: {"id":"tc_2","tool":"edit_document","displayText":"Editing document"}

event: tool_end
data: {"id":"tc_2","status":"success","documentXml":"<lesson>...</lesson>"}

event: text
data: {"content":"I've added a fill-in-the-blank exercise with 5 sentences..."}

event: done
data: {"messageId":"msg_456"}
```

### Flow 4: Error handling

**User:** "Add an exercise" (vague request)

```
LLM thinks: This is vague, I should ask for clarification instead of guessing
LLM responds: "I'd be happy to add an exercise! Could you tell me:
- What type? (fill-in-the-blank, multiple choice, etc.)
- What topic or grammar point?
- What level are your students?"
```

No tools called - AI asks for clarification instead of guessing.

---

## Backend Implementation

### HTTP Action: `/api/chat/stream`

```typescript
// apps/backend/convex/http.ts (add to existing)

http.route({
  path: "/api/chat/stream",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Parse and validate request
    const body = await request.json();
    const { sessionId, content, documentXml } = body;

    // 2. Authenticate user
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await authenticateUser(ctx, token);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 3. Validate session access
    const session = await ctx.runQuery(internal.chat.getSession, { sessionId });
    if (!session || session.userId !== user._id) {
      return new Response("Session not found", { status: 404 });
    }

    // 4. Load conversation history
    const history = await ctx.runQuery(internal.chat.getRecentMessages, {
      sessionId,
      limit: 20,
    });

    // 5. Build messages array for LLM
    const messages = buildMessages(history, content, documentXml);

    // 6. Store user message
    const userMessageId = await ctx.runMutation(
      internal.chat.createUserMessage,
      {
        sessionId,
        content,
      },
    );

    // 7. Create streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Helper to send SSE events
    const sendEvent = (event: string, data: any) => {
      writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    };

    // 8. Start LLM stream in background
    (async () => {
      try {
        const result = await streamText({
          model: openai("gpt-4o-mini"),
          system: buildSystemPrompt(),
          messages,
          tools: {
            load_skill: createLoadSkillTool(sendEvent),
            edit_document: createEditDocumentTool(sendEvent),
          },
          maxSteps: 10,
          onStepFinish: ({ toolCalls, toolResults }) => {
            // Tool events are sent within the tool execute functions
          },
        });

        // Stream text chunks
        for await (const chunk of result.textStream) {
          sendEvent("text", { content: chunk });
        }

        // Get final result
        const finalResult = await result;

        // Store assistant message
        const assistantMessageId = await ctx.runMutation(
          internal.chat.createAssistantMessage,
          {
            sessionId,
            response: {
              text: finalResult.text,
              toolCalls: extractToolCalls(finalResult),
              documentXml: extractFinalDocumentXml(finalResult),
            },
            model: "gpt-4o-mini",
          },
        );

        sendEvent("done", { messageId: assistantMessageId });
      } catch (error) {
        sendEvent("error", {
          message: error instanceof Error ? error.message : "Unknown error",
          code: "LLM_ERROR",
        });
      } finally {
        writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }),
});
```

### Tool Implementations

```typescript
// apps/backend/convex/chat/tools.ts

import { tool } from "ai";
import { z } from "zod";

const SKILL_FILES = {
  "fill-blanks": "fill-blanks.md",
  "multiple-choice": "multiple-choice.md",
  "true-false": "true-false.md",
  sequencing: "sequencing.md",
  "short-answer": "short-answer.md",
  "writing-exercises": "writing-exercises.md",
};

const DISPLAY_TEXT = {
  "fill-blanks": "Checking fill-blanks rules",
  "multiple-choice": "Checking multiple-choice rules",
  "true-false": "Checking true-false rules",
  sequencing: "Checking sequencing rules",
  "short-answer": "Checking short-answer rules",
  "writing-exercises": "Checking writing exercise rules",
};

export function createLoadSkillTool(
  sendEvent: (event: string, data: any) => void,
) {
  return tool({
    description:
      "Load specialized instructions for creating specific types of exercises. Always use this before creating exercises to ensure correct formatting.",
    parameters: z.object({
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
    execute: async ({ skill }) => {
      const toolId = `tc_${Date.now()}`;
      const displayText = DISPLAY_TEXT[skill];

      // Send start event
      sendEvent("tool_start", {
        id: toolId,
        tool: "load_skill",
        args: { skill },
        displayText,
      });

      try {
        // Load skill content from prompts
        const content = await loadSkillFile(SKILL_FILES[skill]);

        sendEvent("tool_end", { id: toolId, status: "success" });

        return {
          success: true,
          instructions: content,
        };
      } catch (error) {
        sendEvent("tool_end", { id: toolId, status: "error" });
        return {
          success: false,
          error: "Failed to load skill",
        };
      }
    },
  });
}

export function createEditDocumentTool(
  sendEvent: (event: string, data: any) => void,
) {
  return tool({
    description:
      "Replace the document content with new XML. Only use when the user has explicitly requested document changes.",
    parameters: z.object({
      documentXml: z
        .string()
        .describe("Complete document XML wrapped in <lesson> tags"),
      summary: z.string().describe("One-sentence summary of the changes made"),
    }),
    execute: async ({ documentXml, summary }) => {
      const toolId = `tc_${Date.now()}`;

      sendEvent("tool_start", {
        id: toolId,
        tool: "edit_document",
        displayText: "Editing document",
      });

      // Validate XML structure
      const trimmed = documentXml.trim();
      if (!trimmed.startsWith("<lesson>") || !trimmed.endsWith("</lesson>")) {
        sendEvent("tool_end", { id: toolId, status: "error" });
        return {
          success: false,
          error: "Document must be wrapped in <lesson> tags",
        };
      }

      // Send success with documentXml for frontend to apply
      sendEvent("tool_end", {
        id: toolId,
        status: "success",
        documentXml, // Frontend uses this to update editor
      });

      return {
        success: true,
        summary,
      };
    },
  });
}
```

---

## File Structure

```
apps/backend/
  convex/
    chat.ts                    # Updated: queries, mutations (no more generateResponse action)
    http.ts                    # Updated: add /api/chat/stream route
    chat/
      tools.ts                 # NEW: load_skill, edit_document implementations
      prompt-builder.ts        # NEW: builds system prompt with document context
    validators/
      chat.ts                  # Updated: new message schema
  prompts/
    chat/
      base.md                  # NEW: minimal base prompt
      skills/
        fill-blanks.md         # NEW: detailed fill-blanks instructions
        multiple-choice.md     # NEW: multiple choice instructions
        true-false.md          # NEW: true-false instructions
        sequencing.md          # NEW: sequencing instructions
        short-answer.md        # NEW: short answer instructions
        writing-exercises.md   # NEW: writing exercise instructions

apps/teacher/
  src/spaces/document-editor/
    use-streaming-chat.ts      # NEW: replaces use-chat.ts
    chat-messages.tsx          # Updated: handle streaming messages
    assistant-message.tsx      # NEW: assistant message with tool calls
    tool-calls-section.tsx     # NEW: collapsible tool calls display
    chat-sidebar.tsx           # Minor updates
    chat-input.tsx             # Minor updates (disable during streaming)
```

---

## Implementation Phases

### Phase 1: Streaming Infrastructure

**Goal:** Basic streaming working end-to-end without tools.

1. Create HTTP streaming endpoint in Convex (`/api/chat/stream`)
2. Implement SSE parsing utilities in frontend
3. Create `useStreamingChat` hook with basic text streaming
4. Update `ChatMessages` to handle streaming state
5. Test: Send message, see response stream in character by character

**Deliverable:** Text responses stream to the UI instead of appearing all at once.

### Phase 2: Tool System

**Goal:** AI can call tools and we see them in the UI.

1. Implement `edit_document` tool with SSE events
2. Create base prompt (`prompts/chat/base.md`)
3. Wire up document editing (validate XML, send to frontend, apply to editor)
4. Create `ToolCallsSection` component
5. Update `AssistantMessage` to show tool calls
6. Test: "Add a heading" should show "Editing document" then stream response

**Deliverable:** Document edits work via tool calls with visible progress.

### Phase 3: Skills Architecture

**Goal:** AI loads specialized knowledge on demand.

1. Implement `load_skill` tool
2. Create skill files for each exercise type
3. Update base prompt to instruct AI when to load skills
4. Test full flow: "Add fill-in-the-blank" loads skill, then edits document

**Deliverable:** AI transparently loads skills before creating exercises.

### Phase 4: UI Polish & Error Handling

**Goal:** Production-ready UX.

1. Collapse/expand behavior for tool calls
2. Error states (tool failure, stream failure)
3. Loading states during tool execution
4. Disable input while streaming
5. Reconnection handling if stream drops
6. Update message schema and persistence

**Deliverable:** Polished, error-resilient chat experience.

---

## Configuration

### Model Selection

```typescript
// apps/backend/convex/chat/config.ts

export const CHAT_CONFIG = {
  model: "gpt-4o-mini", // Primary model
  maxSteps: 10, // Max tool call rounds
  maxHistoryMessages: 20, // Messages to include in context
  streamChunkSize: 1, // Characters per stream event (1 = character by character)
};
```

### Available Skills

Skills are auto-discovered from `prompts/chat/skills/` directory. To add a new skill:

1. Create `prompts/chat/skills/my-skill.md`
2. Add to `SKILL_FILES` and `DISPLAY_TEXT` maps in `tools.ts`
3. Add to Zod enum in `load_skill` tool parameters

---

## Open Questions (Resolved)

| Question             | Decision                                  |
| -------------------- | ----------------------------------------- |
| Skill caching        | Per-message (not cached across messages)  |
| Document sync timing | Immediately when `edit_document` succeeds |
| Conversation context | Last 20 messages                          |
| Model fallback       | No fallback, just error                   |

---

## Success Criteria

1. **Conversational:** Typing "test" or "hello" gets a friendly response without document changes
2. **Transparent:** Creating an exercise shows "Checking X rules" then "Editing document"
3. **Streaming:** Response text appears progressively, not all at once
4. **Collapsible:** Completed tool calls collapse to "Done (N steps)"
5. **Reliable:** Errors are shown clearly, don't crash the UI

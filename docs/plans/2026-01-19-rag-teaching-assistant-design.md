# RAG-Powered Teaching Assistant Design

**Date:** 2026-01-19
**Status:** Design Phase

## Overview

Design for a RAG-powered AI teaching assistant that can orchestrate the entire teacher application. The assistant uses the library as its knowledge base via vector embeddings, provides a chat interface, and can execute actions across spaces, documents, library, and homework through a tool-calling architecture.

## Vision

A full app controller (Option C from brainstorming) - an AI teaching assistant that can:
- Navigate and operate across the entire app
- Use the library as semantic knowledge base for pedagogical decisions
- Manage spaces, assign homework, analyze progress
- Create and edit lessons using relevant library content
- Operate within current context while accessing global teacher data

**Interaction Model:** Chat interface (similar to ChatGPT/Claude)
- Persistent chat panel accessible globally
- Natural conversation flow with multi-turn interactions
- Stateless sessions (no memory between sessions for v1)

## Architecture

### High-Level Layers

```
┌─────────────────────────────────────────────────┐
│           Chat UI (React Component)             │
│    - Collapsible right panel                    │
│    - Context-aware (tracks user's location)     │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│     Agent Orchestration (Convex Action)         │
│    - Receives message + context                 │
│    - Calls LLM with tool definitions            │
│    - Manages conversation history               │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  Tool Registry │  │  Vector Search  │
│  (15 tools)    │  │  (Convex Native)│
└───────┬────────┘  └──────┬──────────┘
        │                   │
┌───────▼───────────────────▼──────────┐
│   Convex Database + Vector Index     │
│   - Library items with embeddings    │
│   - Chat sessions & messages         │
│   - Spaces, documents, homework      │
└──────────────────────────────────────┘
```

### Component Responsibilities

**1. Vector Layer (Convex Native)**
- Store embeddings directly in `library` table
- Use Convex's `vectorSearch()` API
- 1536-dimension vectors from OpenAI `text-embedding-3-small`
- Index on `embedding` field with filters on `ownerId`, `type`, `metadata.language`

**2. Chat Interface Layer**
- Right-side collapsible panel (384px width)
- Registered at `_protected/_app` route level (globally accessible)
- Captures context per-message (current space, document, exercise node)
- Floating trigger button when collapsed

**3. Agent Orchestration Layer**
- Convex action receives user messages
- Uses Vercel AI SDK's `generateText` with tool calling
- System prompt built via markdown prompt templates
- Handles multi-step tool execution (max 5 steps)

**4. Tool Execution Layer**
- 15 tools wrapping Convex mutations/queries
- All tools run as `internal` functions (security)
- Validate teacher ownership before mutations
- Return structured results to agent

## Database Schema

### New Tables

```typescript
// Context discriminated union
const contextValidator = v.object({
  type: v.union(
    v.literal("space"),
    v.literal("document"),
    v.literal("exercise_node")
    // Extensible: add new types as needed
  ),
  id: v.string(),
});

// AI chat sessions
const aiChatSession = defineTable({
  teacherId: v.string(), // WorkOS user ID
  sessionId: v.string(), // Unique per conversation
  model: v.string(), // e.g., "openai/gpt-4o"
  status: v.union(v.literal("active"), v.literal("archived")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_teacher", ["teacherId"])
  .index("by_session", ["sessionId"]);

// Messages with captured context
const aiChatMessage = defineTable({
  sessionId: v.string(),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("tool")
  ),
  content: v.string(),
  context: v.optional(contextValidator), // Captured at message time
  toolCalls: v.optional(v.array(v.any())),
  tokensUsed: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_session", ["sessionId"]);
```

### Library Table Updates

```typescript
// Add to existing library table
embedding: v.optional(v.array(v.number())), // 1536-dim vector
embeddingModel: v.optional(v.string()), // "text-embedding-3-small"

// Add vector index
.vectorIndex("embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["ownerId", "type", "metadata.language"],
})
```

## Embedding Generation

### When Embeddings Are Created

Embeddings generated automatically when items saved to library:

```typescript
export const saveItemWithMetadata = authedMutation({
  args: { /* existing args */ },
  handler: async (ctx, args) => {
    // 1. Insert item without embedding (get ID)
    const itemId = await ctx.db.insert("library", {
      ownerId: ctx.user.id,
      title: args.title,
      type: args.type,
      content: args.content,
      description: args.description,
      metadata: args.metadata,
      searchText: buildSearchText(...),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Schedule background embedding generation
    await ctx.scheduler.runAfter(0, internal.library.generateEmbedding, {
      itemId,
    });

    return itemId;
  },
});
```

### Embedding Generation Action

```typescript
export const generateEmbedding = internalAction({
  args: { itemId: v.id("library") },
  handler: async (ctx, args) => {
    const item = await ctx.runQuery(internal.library.getItemForEmbedding, {
      itemId: args.itemId,
    });

    // Build text to embed: metadata + title + description
    const textToEmbed = [
      item.title,
      item.description,
      item.metadata?.topic,
      ...(item.metadata?.tags ?? []),
      item.metadata?.language,
      item.metadata?.levels?.join(" "),
    ]
      .filter(Boolean)
      .join("\n");

    // Call OpenAI embeddings API
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: textToEmbed,
      }),
    });

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Store embedding
    await ctx.runMutation(internal.library.storeEmbedding, {
      itemId: args.itemId,
      embedding,
      model: "text-embedding-3-small",
    });
  },
});
```

**Key Decisions:**
- Embed metadata + title + description (not raw content)
- Background processing for instant save UX
- Cache embeddings (generate once)
- Cost: ~$0.02 per 1M tokens

## Vector Search

### The `search_library` Tool

Agent-callable tool for semantic search:

```typescript
export const searchLibrary = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.number()), // Default 5
    filters: v.optional(v.object({
      type: v.optional(libraryItemTypeValidator),
      language: v.optional(v.string()),
      levels: v.optional(v.array(cefrLevelValidator)),
    })),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    // Generate query embedding
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: args.query,
      }),
    });

    const data = await response.json();
    const queryEmbedding = data.data[0].embedding;

    // Perform vector search
    const results = await ctx.vectorSearch("library", "embedding", {
      vector: queryEmbedding,
      limit: limit * 2, // Get extras for filtering
      filter: (q) => {
        if (args.filters?.type) {
          q = q.eq("type", args.filters.type);
        }
        if (args.filters?.language) {
          q = q.eq("metadata.language", args.filters.language);
        }
        return q;
      },
    });

    // Post-filter for CEFR levels
    let filtered = results;
    if (args.filters?.levels && args.filters.levels.length > 0) {
      filtered = results.filter((item) => {
        const itemLevels = item.metadata?.levels ?? [];
        return args.filters!.levels!.some(level => itemLevels.includes(level));
      });
    }

    return filtered.slice(0, limit);
  },
});
```

**Retrieval Strategy:** Agent-Decided (Option B)
- Agent decides when to search library based on query
- Gets `search_library` tool it can call when needed
- Efficient - only searches when relevant

## Tool Registry

### Available Tools (15 total)

**Document Operations:**
- `create_lesson` - Create new lesson in a space
- `add_content_to_lesson` - Insert exercises/content into existing lesson
- `insert_library_item` - Add library exercise to current lesson

**Space Management:**
- `list_spaces` - See all teacher's spaces
- `get_space_details` - Get info about specific space
- `create_space_invite` - Generate invite link for new student

**Homework Operations:**
- `assign_homework` - Mark exercises as homework
- `list_homework` - See student's homework status
- `get_student_progress` - View completion status

**Library Operations:**
- `search_library` - Vector search for relevant items
- `save_to_library` - Save current selection to library
- `list_library_items` - Browse library by metadata filters

**Context/Read:**
- `get_current_context` - What space/lesson is active
- `get_lesson_content` - Read a specific lesson's content

### Tool Definition Pattern

```typescript
// convex/tools/registry.ts
export const TOOL_REGISTRY = [
  {
    name: "create_lesson",
    description: "Create a new lesson in a space with optional initial content",
    parameters: {
      type: "object",
      properties: {
        spaceId: { type: "string", description: "Space ID" },
        title: { type: "string", description: "Lesson title" },
        content: { type: "string", description: "Optional Tiptap JSON content" },
      },
      required: ["spaceId", "title"],
    },
    handler: internal.tools.document.createLesson,
  },
  {
    name: "search_library",
    description: "Search library for relevant exercises using semantic search",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 5)" },
        filters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["exercise", "template", "group"] },
            language: { type: "string" },
            levels: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["query"],
    },
    handler: internal.library.searchLibrary,
  },
  // ... 13 more tools
];
```

### Tool Execution

```typescript
export const executeToolCall = internalAction({
  args: {
    toolName: v.string(),
    toolArgs: v.any(),
    teacherId: v.string(),
  },
  handler: async (ctx, args) => {
    const tool = TOOL_REGISTRY.find(t => t.name === args.toolName);

    if (!tool) {
      throw new ConvexError(`Unknown tool: ${args.toolName}`);
    }

    try {
      // Execute with auth context injected
      const result = await tool.handler(ctx, {
        ...args.toolArgs,
        teacherId: args.teacherId,
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});
```

**Security:**
- All tools are `internal` functions (not client-exposed)
- `teacherId` injected into every call for auth
- Tools validate ownership before mutations

## Agent Orchestration

### System Prompt (Markdown Template)

Create `prompts/teaching-assistant-system.md`:

```markdown
# Teaching Assistant System Prompt

You are a teaching assistant helping a language teacher manage their students and content.

## Current Context

{contextDescription}

## Your Capabilities

You have access to tools that allow you to:

### Document Operations
- Create new lessons in spaces
- Add content to existing lessons
- Insert exercises from the teacher's library

### Library Operations
- Search the teacher's library using semantic search
- Find relevant exercises, templates, and groups
- Browse library items by metadata (language, level, topic)

### Space Management
- List all teacher's spaces
- Get details about specific spaces (student, language, lessons)
- Create invite links for new students

### Homework Operations
- Assign exercises as homework to students
- Check homework status and completion
- View student progress

## Guidelines

1. **Be proactive**: When a teacher asks to create content, search their library first to see if relevant exercises already exist
2. **Use context**: Pay attention to the current space, lesson, or exercise being viewed
3. **Ask for clarification**: If a request is ambiguous, ask specific questions
4. **Explain actions**: When you use tools, explain what you're doing and why
5. **Suggest improvements**: If you notice patterns or opportunities, point them out

## Response Style

- Be concise and helpful
- Use the teacher's terminology and preferences
- Reference specific items by name when possible
- Provide actionable next steps
```

Update `apps/backend/scripts/build-prompts.ts`:

```typescript
{
  name: "buildTeachingAssistantSystem",
  content: readFileSync(
    join(promptsDir, "teaching-assistant-system.md"),
    "utf-8"
  ),
  vars: [{ name: "contextDescription", optional: false }],
},
```

### Main Chat Handler

```typescript
// convex/agent.ts
import { buildTeachingAssistantSystem } from "./_generated_prompts";
import { generateText } from "ai";

export const sendMessage = action({
  args: {
    sessionId: v.string(),
    message: v.string(),
    context: v.optional(contextValidator),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const teacherId = identity.subject;
    const model = args.model ?? "openai/gpt-4o";

    // Store user message
    await ctx.runMutation(internal.agent.storeMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.message,
      context: args.context,
    });

    // Get conversation history
    const history = await ctx.runQuery(internal.agent.getHistory, {
      sessionId: args.sessionId,
    });

    // Build context description
    const contextDesc = args.context
      ? await buildContextDescription(ctx, args.context, teacherId)
      : "No active context - teacher is viewing the main interface";

    // Generate system prompt using builder
    const systemPrompt = buildTeachingAssistantSystem({
      contextDescription: contextDesc,
    });

    // Call LLM with tools
    const response = await generateText({
      model,
      system: systemPrompt,
      messages: history.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: TOOL_REGISTRY,
      maxSteps: 5, // Allow multi-step tool usage
    });

    // Store assistant message
    await ctx.runMutation(internal.agent.storeMessage, {
      sessionId: args.sessionId,
      role: "assistant",
      content: response.text,
      toolCalls: response.toolCalls,
      tokensUsed: response.usage?.totalTokens,
    });

    return {
      message: response.text,
      toolCalls: response.toolCalls?.length ?? 0,
    };
  },
});
```

### Context Description Helper

```typescript
async function buildContextDescription(ctx, context, teacherId) {
  switch (context.type) {
    case "space":
      const space = await ctx.runQuery(internal.spaces.getSpace, {
        spaceId: context.id,
        teacherId,
      });
      return `Active space: ${space.language} with student ${space.studentName}`;

    case "document":
      const doc = await ctx.runQuery(internal.documents.getDocument, {
        documentId: context.id,
        teacherId,
      });
      return `Editing lesson: "${doc.title}" in space ${doc.spaceName}`;

    case "exercise_node":
      return `Focused on exercise node: ${context.id}`;

    default:
      return "Unknown context";
  }
}
```

**Key Features:**
- Vercel AI SDK's `generateText` handles tool calling loop
- `maxSteps: 5` allows multi-step tool sequences
- System prompt includes current context
- Model-agnostic (OpenAI default, configurable)

## Chat UI

### Layout Structure

Modify `apps/teacher/src/routes/_protected/_app/route.tsx`:

```typescript
function RouteComponent() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Get current context from route
  const location = useLocation();
  const context = useMemo(() => {
    if (location.pathname.includes("/spaces/")) {
      const spaceId = location.params.id;
      return { type: "space" as const, id: spaceId };
    }
    if (location.pathname.includes("/lesson/")) {
      const docId = location.params.lessonId;
      return { type: "document" as const, id: docId };
    }
    return undefined;
  }, [location]);

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <Sidebar collapsible="icon" variant="inset">
        {/* existing sidebar */}
      </Sidebar>

      <SidebarInset className="flex">
        <div className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>

        {/* AI Assistant Panel */}
        <AssistantPanel
          open={assistantOpen}
          onOpenChange={setAssistantOpen}
          sessionId={sessionId}
          context={context}
        />
      </SidebarInset>

      {/* Floating trigger button when collapsed */}
      {!assistantOpen && (
        <Button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
          size="icon"
        >
          <SparklesIcon className="size-6" />
        </Button>
      )}
    </SidebarProvider>
  );
}
```

### AssistantPanel Component

```typescript
// components/assistant-panel.tsx
interface AssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  context?: { type: "space" | "document" | "exercise_node"; id: string };
}

export function AssistantPanel({
  open,
  onOpenChange,
  sessionId,
  context,
}: AssistantPanelProps) {
  if (!open) return null;

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      <div className="flex items-center justify-between h-14 px-4 border-b">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <TeachingAssistantChat
        sessionId={sessionId}
        context={context}
        className="flex-1"
      />
    </div>
  );
}
```

### TeachingAssistantChat Component

```typescript
// packages/editor/src/components/TeachingAssistantChat.tsx
export function TeachingAssistantChat({
  sessionId,
  context,
  className,
}: TeachingAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const convex = useConvex();

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      const history = await convex.query(api.agent.getHistory, {
        sessionId,
      });
      setMessages(history);
    };
    loadHistory();
  }, [sessionId, convex]);

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      context,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await convex.action(api.agent.sendMessage, {
        sessionId,
        message: input,
        context,
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.message,
      }]);
    } catch (error) {
      // Handle error
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isStreaming && <LoadingIndicator />}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={isStreaming}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**UI Placement:**
- Right-side collapsible panel (384px width)
- Same styling as main content (white rounded card)
- Available globally (registered at `_protected/_app` route)
- Floating trigger button when collapsed
- Context captured per-message

## Context Management

### Discriminated Union Pattern

Context uses type-safe discriminated union (inspired by Notion's reference system):

```typescript
const contextValidator = v.object({
  type: v.union(
    v.literal("space"),
    v.literal("document"),
    v.literal("exercise_node")
    // Easy to extend: just add new literals
  ),
  id: v.string(),
});
```

**Benefits:**
- Type-safe and validated by Convex
- Easy to extend without schema changes
- Works like Claude Code's IDE integration - aware of active focus

**Example contexts:**
- `{ type: "space", id: "space-123" }` - Viewing a space
- `{ type: "document", id: "doc-456" }` - Editing a lesson
- `{ type: "exercise_node", id: "node-789" }` - Focused on an exercise

### Context Scope

Agent operates with **Global Knowledge + Current Focus** (Option C):
- Has access to all teacher's data (spaces, library, students)
- Primarily operates in current context (active space/document)
- Can pull cross-space insights when relevant
- Teacher can explicitly request broader analysis

Similar to Claude Code: sees current file but can navigate entire codebase.

## Design Decisions Summary

| Decision Point | Choice | Rationale |
|---|---|---|
| Vector database | Convex native | Simplifies architecture, one database |
| Embedding model | text-embedding-3-small | Cost-effective, 1536 dims |
| Embedding granularity | Item-level | Simple, teachers save focused content |
| Retrieval strategy | Agent-decided | Efficient, only searches when relevant |
| Tool execution | Function calling pattern | Clear boundaries, auditable |
| Agent scope | Global knowledge + current focus | Powerful but focused by default |
| Memory | Stateless (v1) | Simple to start, add later if needed |
| Interaction model | Chat interface | Natural for complex multi-step tasks |
| Context management | Discriminated union | Type-safe, extensible |
| System prompts | Markdown templates | Version controlled, easy to iterate |

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Add embedding fields to library schema
- [ ] Implement embedding generation on library save
- [ ] Build vector search tool
- [ ] Create chat session schema
- [ ] Implement basic chat UI (no tools yet)

### Phase 2: Tool System (Week 2-3)
- [ ] Define tool registry with 15 tools
- [ ] Implement document operation tools
- [ ] Implement library operation tools
- [ ] Implement space/homework tools
- [ ] Add tool execution handler with auth

### Phase 3: Agent Integration (Week 3-4)
- [ ] Create teaching assistant system prompt
- [ ] Integrate prompt builder
- [ ] Implement main agent orchestration
- [ ] Wire up chat UI to agent
- [ ] Add context capture per-message

### Phase 4: Polish (Week 4+)
- [ ] Error handling and edge cases
- [ ] Loading states and optimistic updates
- [ ] Cost tracking and monitoring
- [ ] Testing and iteration

## Future Enhancements (Post-V1)

**Memory & Learning:**
- Persistent conversation history
- Teacher preference learning
- Pattern recognition ("you usually assign 3-5 exercises per week")

**Advanced RAG:**
- Hybrid search (vector + keyword)
- Re-ranking for better relevance
- Chunk-level embeddings for large items

**Richer Context:**
- Student performance data in context
- Historical lesson patterns
- Cross-student comparisons

**Additional Tools:**
- Student progress analytics
- Lesson template generation
- Bulk operations (assign to multiple students)
- Integration with external resources

**UI Improvements:**
- Streaming responses
- Tool execution visibility
- Suggested prompts
- Keyboard shortcuts

## Open Questions

1. **Token costs:** Need to monitor actual costs and set quotas if needed
2. **Rate limiting:** Should we limit queries per teacher per day?
3. **Streaming:** Should responses stream or return complete?
4. **Tool visibility:** Should UI show which tools the agent is calling?
5. **Error recovery:** How should agent handle tool failures?

## Success Metrics

**V1 Success Criteria:**
- Teachers can ask "create a B1 lesson about food" and get relevant library exercises inserted
- Agent successfully uses context (knows current space, lesson)
- Tool execution works reliably with proper auth
- Vector search returns relevant results
- Chat UI is responsive and doesn't block main app

**Future Metrics:**
- Time saved per lesson creation
- % of library items reused vs. created new
- Teacher satisfaction scores
- Token cost per active teacher
- Tool success rate

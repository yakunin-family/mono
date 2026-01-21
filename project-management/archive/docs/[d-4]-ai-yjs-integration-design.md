---
title: AI + Yjs Document Modification Architecture
created: 2025-01-21
---

# AI + Yjs Document Modification: Architecture Design

This document outlines the recommended approach for letting agentic AI modify Yjs-based collaborative documents in our architecture.

## Architecture Overview

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│  Client  │────▶│ Main Backend │     │ Hocuspocus      │
│ (React)  │◀────│   (Convex)   │     │ (Yjs sync only) │
└────┬─────┘     └──────────────┘     └────────▲────────┘
     │                                         │
     └─────────WebSocket (Yjs sync)────────────┘
```

## Core Principle

**Hocuspocus should stay dumb** — it's just a sync relay. It shouldn't run AI or have business logic. The main backend owns the AI conversation; the client owns applying changes to Yjs.

## Recommended Flow

```
1. User: "Add a summary paragraph"
        │
        ▼
2. Client → Main Backend: { message, conversationId, documentContext? }
        │
        ▼
3. Main Backend:
   - Stores message in conversation
   - Calls LLM with context
   - Returns AI response (text/structured content)
        │
        ▼
4. Client receives AI response
        │
        ▼
5. Client applies changes to local Yjs doc (via Tiptap editor API)
        │
        ▼
6. Hocuspocus automatically syncs to other clients
```

## Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| Client | Chat UI, apply AI output to editor, Yjs sync |
| Main Backend | Conversation storage, AI calls, business logic |
| Hocuspocus | Yjs sync relay only — stays dumb |

## Implementation

### Client-Side

```typescript
async function handleAIRequest(prompt: string) {
  // 1. Get current document state to send as context (optional)
  const currentContent = editor.getHTML(); // or getText()

  // 2. Call your main backend
  const response = await convex.mutation(api.ai.chat, {
    conversationId,
    message: prompt,
    documentContext: currentContent,
  });

  // 3. Apply AI's response to the editor (which uses Yjs under the hood)
  if (response.type === "insert") {
    editor.chain()
      .focus()
      .insertContent(response.content)
      .run();
  } else if (response.type === "replace") {
    editor.chain()
      .selectAll()
      .insertContent(response.content)
      .run();
  }

  // 4. Yjs automatically syncs via Hocuspocus — no extra work needed
}
```

### Main Backend (Convex)

```typescript
export const chat = mutation({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
    documentContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Store the message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.message,
    });

    // Call AI
    const aiResponse = await generateAIResponse(args.message, args.documentContext);

    // Store AI response
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: aiResponse.text,
    });

    // Return structured response for client to apply
    return {
      type: "insert",
      content: aiResponse.documentContent,
    };
  },
});
```

## Alternative Approaches

### Approach 1: Server-Side Direct Manipulation

The AI operates on the Yjs document directly on the server, without needing a persistent WebSocket connection:

```typescript
import * as Y from "yjs";

// Load document state (from DB, Hocuspocus, etc.)
const ydoc = new Y.Doc();
Y.applyUpdate(ydoc, existingState);

// AI modifies the document
const ytext = ydoc.getText("content");
ytext.insert(0, "AI-generated content here");

// Get the update to broadcast/persist
const update = Y.encodeStateAsUpdate(ydoc);
```

**Best for**: One-shot AI operations, background processing, async workflows.

### Approach 2: AI as a Collaboration Client

The AI connects via WebSocket like any other user:

```typescript
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const ydoc = new Y.Doc();
const provider = new HocuspocusProvider({
  url: "ws://localhost:1234",
  name: "document-id",
  document: ydoc,
  token: "ai-agent-token",
});

provider.on("synced", () => {
  const ytext = ydoc.getText("content");
  const currentContent = ytext.toString();
  ytext.insert(ytext.length, "\n\nAI addition");
});
```

**Best for**: Real-time AI presence, streaming responses, AI that reacts to user edits.

### Approach 3: Hocuspocus Server Hook

Use server-side hooks to let AI modify documents through an API:

```typescript
import { Server } from "@hocuspocus/server";

const server = Server.configure({
  async onLoadDocument({ document, documentName }) {
    // Load from DB
  },
});

app.post("/api/ai-edit/:docId", async (req, res) => {
  const { docId } = req.params;
  const { prompt } = req.body;

  const connection = await server.openDirectConnection(docId);

  const currentContent = connection.document.getText("content").toString();
  const aiResponse = await callAI(prompt, currentContent);

  connection.document.getText("content").insert(0, aiResponse);

  await connection.disconnect();

  res.json({ success: true });
});
```

**Best for**: On-demand AI assistance, keeping AI separate from real-time connections.

## Comparison Matrix

| Approach | Latency | Complexity | Real-time Presence | Scalability |
|----------|---------|------------|-------------------|-------------|
| Client applies (recommended) | Low | Low | No | High |
| Direct manipulation | Low | Low | No | High |
| WebSocket client | Medium | Medium | Yes | Medium |
| Server hook | Low | Medium | No | High |

## When to Involve Hocuspocus Directly

Only in these edge cases:

1. **Offline/background processing** — AI modifies a doc when no clients are connected
2. **Server-authoritative changes** — Changes that must happen even if the requesting client disconnects
3. **Multi-document operations** — AI needs to modify several docs atomically

For these cases, the main backend would call Hocuspocus's direct connection API:

```typescript
const response = await fetch("http://hocuspocus:1234/api/documents/doc-123", {
  method: "POST",
  body: JSON.stringify({ operations: [...] }),
});
```

## Recommendation

For a chat-based AI assistant, **let the client apply changes**. This approach:

- Keeps the architecture simple
- Doesn't require Hocuspocus to understand business logic
- Leverages existing Yjs sync automatically
- Works well with async AI operations (LLM calls can be slow)

The Yjs server gets involved passively — it just syncs whatever changes the client makes after receiving the AI response.

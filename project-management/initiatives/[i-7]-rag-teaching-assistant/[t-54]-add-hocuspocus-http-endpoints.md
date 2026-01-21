---
status: todo
priority: medium
description: Implement HTTP API endpoints on Hocuspocus server to enable agent-driven document editing
tags: [collab-server, hocuspocus, api]
---

# Add Hocuspocus HTTP Endpoints for Document Editing

Implement HTTP API endpoints on the Hocuspocus server to enable agent-driven document editing.

## Background

Convex actions cannot maintain WebSocket connections, so the agent cannot join as a collaborative client. Instead, we expose HTTP endpoints that the agent can call to insert content into documents.

## Implementation

Update `apps/collab-server/src/index.ts`:

### 1. Add HTTP Endpoint

```typescript
// POST /document/:docId/insert-content
app.post("/document/:docId/insert-content", async (req, res) => {
  const { docId } = req.params;
  const { afterNodeId, content, position } = req.body;

  try {
    // 1. Load document's Yjs state
    const doc = await server.loadDocument(docId);

    // 2. Find node by stable ID in Prosemirror doc
    const targetNode = findNodeById(doc, afterNodeId);

    if (!targetNode) {
      return res.status(404).json({
        error: "Node not found",
        message: "The referenced node no longer exists in the document"
      });
    }

    // 3. Calculate insertion position
    const insertPos = position === "before"
      ? targetNode.pos
      : targetNode.pos + targetNode.node.nodeSize;

    // 4. Apply Yjs transaction to insert content
    doc.transact(() => {
      // Insert Tiptap JSON at position
      insertContentAtPos(doc, insertPos, content);
    });

    // 5. Changes propagate via normal Yjs sync
    res.json({ success: true, insertedAt: insertPos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Helper Functions

* `findNodeById`: Traverse Prosemirror doc to find node by stable ID
* `insertContentAtPos`: Insert Tiptap JSON into Yjs document

## Acceptance Criteria

- [ ] HTTP endpoint accepts `documentId`, `afterNodeId`, `content`, `position`
- [ ] Endpoint loads current Yjs document state
- [ ] Finds target node by stable ID (not position index)
- [ ] Inserts content via Yjs transaction
- [ ] Changes propagate to all connected clients
- [ ] Returns 404 if node not found (allows agent retry)
- [ ] Error handling for malformed content
- [ ] Authentication/authorization (verify agent identity)

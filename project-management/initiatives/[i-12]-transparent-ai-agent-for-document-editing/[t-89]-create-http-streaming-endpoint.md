---
status: todo
priority: high
description: Create /api/chat/stream HTTP action in Convex with SSE support
tags: [ai, editor, streaming]
---

# Create HTTP streaming endpoint

Create the `/api/chat/stream` HTTP action in Convex that will handle streaming AI responses via Server-Sent Events (SSE).

## Requirements

1. Create `POST /api/chat/stream` HTTP action in `apps/backend/convex/http.ts`
2. Handle authentication via session token from Authorization header
3. Validate session access (user owns the session)
4. Load conversation history (last 20 messages)
5. Return SSE stream with proper headers:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache`
   - `Connection: keep-alive`
6. Initially just echo back a test response to verify streaming works

## Request Format

```
POST /api/chat/stream
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "sessionId": "j57...",
  "content": "User message",
  "documentXml": "<lesson>..."
}
```

## Response Format (SSE)

```
event: text
data: {"content":"Hello"}

event: text
data: {"content":" world"}

event: done
data: {"messageId":"msg_123"}
```

## File

`apps/backend/convex/http.ts`

## Acceptance Criteria

- [ ] Endpoint authenticates user via session token
- [ ] Endpoint validates session ownership
- [ ] Endpoint returns proper SSE headers
- [ ] Test message can be sent and echoed back as streaming events
- [ ] Error responses return appropriate HTTP status codes

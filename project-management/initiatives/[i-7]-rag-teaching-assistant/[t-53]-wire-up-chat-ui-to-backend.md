---
status: todo
priority: medium
description: Connect the chat UI components to the agent orchestration backend
tags: [frontend, teacher-app, integration]
---

# Wire Up Chat UI to Agent Backend

Connect the chat UI components (from Phase 1) to the agent orchestration backend.

## Changes Needed

Update `apps/teacher/src/components/teaching-assistant-chat.tsx`:

### 1. Replace Hardcoded Responses

Remove placeholder/hardcoded responses and connect to real agent action:

```typescript
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
    // Call agent with streaming
    const stream = await convex.action(api.agent.sendMessage, {
      sessionId,
      message: input,
      context,
    });

    // Handle streaming response
    let assistantMessage = "";
    for await (const chunk of stream) {
      assistantMessage += chunk;
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === "assistant") {
          lastMsg.content = assistantMessage;
        } else {
          updated.push({ role: "assistant", content: assistantMessage });
        }
        return updated;
      });
    }
  } catch (error) {
    // Handle error
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "I encountered an error. Please try again.",
    }]);
  } finally {
    setIsStreaming(false);
  }
};
```

### 2. Load Message History

Implement history loading from database:

```typescript
useEffect(() => {
  const loadHistory = async () => {
    const history = await convex.query(api.agent.getHistory, {
      sessionId,
    });
    setMessages(history);
  };
  loadHistory();
}, [sessionId, convex]);
```

## Acceptance Criteria

- [ ] Chat UI calls agent backend instead of placeholder responses
- [ ] Streaming responses display incrementally
- [ ] Message history loads from database on mount
- [ ] Context passed with every message
- [ ] Error handling shows user-friendly messages
- [ ] Loading states work correctly during streaming
- [ ] UI remains responsive during agent processing

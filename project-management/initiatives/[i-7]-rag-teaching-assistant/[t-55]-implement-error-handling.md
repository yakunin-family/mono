---
status: todo
priority: low
description: Add robust error handling across all layers of the RAG assistant system
tags: [backend, frontend, error-handling]
---

# Implement Comprehensive Error Handling

Add robust error handling across all layers of the RAG assistant system.

## Areas to Cover

### 1. LLM Failures

* Model timeouts or rate limits
* Malformed JSON responses
* Tool calls with invalid parameters
* Display user-friendly error messages in chat

### 2. Tool Execution Failures

* Permission denied (teacher doesn't own resource)
* Resource not found (invalid IDs)
* Convex mutation errors
* Hocuspocus HTTP API failures
* Return structured errors to agent for explanation

### 3. Vector Search Edge Cases

* Empty library (no results)
* No embeddings generated yet
* Query embedding generation failures
* Agent should acknowledge and suggest alternatives

### 4. Context Issues

* Invalid context objects
* Resources deleted between messages
* Multiple spaces with same student name
* Include disambiguating info (language, space ID)

### 5. Concurrent Modifications

* User edits while agent is working
* Node IDs no longer exist
* Agent retries with different anchor points

### 6. Token Limit Exceeded

* Very long conversations
* Truncate history to last 10 messages
* Summarize if needed

## Implementation Pattern

```typescript
try {
  const result = await operation();
  return { success: true, result };
} catch (error) {
  if (error instanceof ConvexError) {
    // User-facing error - return to agent
    return {
      success: false,
      error: error.message,
      shouldRetry: false,
    };
  }
  // Unexpected error - log and return generic message
  console.error("Unexpected error:", error);
  return {
    success: false,
    error: "An unexpected error occurred",
    shouldRetry: true,
  };
}
```

## Acceptance Criteria

- [ ] All tool handlers return structured error responses
- [ ] Agent receives error messages and explains to user
- [ ] UI shows user-friendly error messages
- [ ] Errors logged for debugging
- [ ] Retry logic for transient failures
- [ ] Graceful degradation when services unavailable
- [ ] No sensitive information exposed in error messages

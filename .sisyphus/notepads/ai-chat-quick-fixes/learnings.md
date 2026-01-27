# Learnings: AI Chat Quick Fixes

## [2026-01-27] Type Safety & Memory Management

### Pattern: Proper Type Assertion for Convex Agent Hooks

**Problem**: `useThreadMessages` hook from `@convex-dev/agent/react` requires specific type signature that Convex's generated API types don't preserve.

**Solution**: Use proper type assertion instead of `as any`:

```typescript
import type { MessageDoc } from "@convex-dev/agent";
import type { ThreadMessagesQuery } from "@convex-dev/agent/react";

const messagesResult = useThreadMessages(
  api.chat.listThreadMessages as ThreadMessagesQuery<
    Record<string, never>, // No extra args beyond threadId
    MessageDoc // Message type
  >,
  threadId ? { threadId } : "skip",
  { initialNumItems: 50, stream: true },
);
```

**Why this works**:

- `ThreadMessagesQuery<ExtraArgs, MessageType>` is the expected type
- Our query has no extra args, so we use `Record<string, never>`
- Our messages are `MessageDoc` type from the agent library
- This is type-safe because our backend query implements the correct contract

**Key insight**: Type assertion to a specific type is acceptable when you can verify the contract is correct. `as any` bypasses all type checking and should be avoided.

---

### Pattern: Cleanup Effects for Refs and State

**Problem**: When switching between threads, the `appliedMessageIds` ref and state maps (`operationResults`, `editResults`) were never cleared, causing memory leak.

**Solution**: Add cleanup effect that watches `threadId`:

```typescript
// Clear state when switching threads to prevent memory leak
useEffect(() => {
  appliedMessageIds.current.clear();
  setOperationResults(new Map());
  setEditResults(new Map());
}, [threadId]);
```

**Why this pattern**:

- Refs don't trigger re-renders, so they need explicit cleanup
- State maps should be reset to empty Maps (not mutated)
- Dependency array `[threadId]` ensures cleanup only on thread change
- Prevents indefinite growth of tracked message IDs across threads

**Key insight**: When using refs to track state across renders, always consider cleanup effects when the context changes (like switching threads, routes, etc.).

---

## [2026-01-27] Error Boundaries for Chat Components

### Pattern: React Error Boundary for Isolated Failure Handling

**Implementation**:

- Created `ChatErrorBoundary` class component
- Used `getDerivedStateFromError` for state updates
- Used `componentDidCatch` for error logging
- Provided friendly fallback UI with retry button

**Wrapping strategy**:

```tsx
<ChatSidebar>
  <ChatErrorBoundary>
    {/* Only wrap the content that could fail */}
    <ChatMessages />
    <ChatInput />
  </ChatErrorBoundary>
</ChatSidebar>
```

**Key decisions**:

- Don't wrap the entire sidebar (keep header/thread selector outside)
- Show user-friendly message, not technical details
- Provide reset button to retry without page refresh
- Log errors to console for debugging

**Why this matters**:

- Chat uses complex streaming/parsing logic that could fail
- JSON parse errors, network issues, or bugs shouldn't crash the editor
- Error boundary isolates failures to chat area only
- Users can retry without losing editor state

---

## Verification Approach

**Type checks**: Always run both scoped and full monorepo checks

```bash
pnpm check-types --filter @app/teacher  # Scoped
pnpm check-types                         # Full monorepo
```

**Code verification**: Use grep to confirm changes

```bash
grep -r "as any" apps/teacher/src/spaces/document-editor/  # Should be empty
```

**LSP diagnostics**: Check files individually for type errors

- More immediate feedback than full type check
- Catches issues before committing

---

## Commit Strategy

**Grouped commits**: Related changes committed together

- Tasks 1+2: Both modified `use-chat.ts`, committed as one unit
- Task 3: New file + integration, separate commit

**Commit messages**: Follow conventional commits

- `fix(scope):` for bug fixes
- `feat(scope):` for new features
- Include "why" in commit body when helpful

---

## Tools & Libraries

**@convex-dev/agent@0.3.2**:

- Exports `MessageDoc` type from `@convex-dev/agent`
- Exports `ThreadMessagesQuery` type from `@convex-dev/agent/react`
- `useThreadMessages` hook for streaming message subscriptions

**React Error Boundaries**:

- Class component pattern (no hooks equivalent yet)
- `getDerivedStateFromError` for state updates
- `componentDidCatch` for side effects (logging)

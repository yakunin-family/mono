# AI Chat Quick Fixes

## Context

### Original Request

Comprehensive review of agentic AI chat identified quick wins that can be fixed immediately:

1. Fix `as any` type assertion in use-chat.ts (violates codebase rules)
2. Fix memory leak in appliedMessageIds ref (grows indefinitely)
3. Add error boundary to chat components (crash protection)

### Interview Summary

**Key Discussions**:

- User confirmed these are quick fixes worth doing now
- Type assertion can be replaced with proper `ThreadMessagesQuery` type from `@convex-dev/agent/react`
- Memory leak occurs because `appliedMessageIds` ref is never cleared when thread changes
- Error boundary should wrap chat to prevent crashes from affecting editor

**Research Findings**:

- `ThreadMessagesQuery` is exported from `@convex-dev/agent/react`
- `MessageDoc` is exported from `@convex-dev/agent`
- The type assertion is safe because `listThreadMessages` implements the correct contract

---

## Work Objectives

### Core Objective

Fix three technical debt items in the AI chat implementation to improve type safety, prevent memory leaks, and add crash protection.

### Concrete Deliverables

- Updated `use-chat.ts` with proper typing and memory leak fix
- New `chat-error-boundary.tsx` component
- Updated lesson editor route with error boundary

### Definition of Done

- [x] No `as any` in use-chat.ts
- [x] `appliedMessageIds` cleared when threadId changes
- [x] Chat failures don't crash the entire editor

### Must Have

- Type-safe hook usage without eslint-disable
- Cleanup effect for memory leak
- Error boundary with user-friendly fallback UI

### Must NOT Have (Guardrails)

- Don't change the hook's behavior or API
- Don't add complex retry logic to error boundary
- Don't modify unrelated files
- Don't add unnecessary dependencies

---

## Verification Strategy (MANDATORY)

### Test Decision

- **Infrastructure exists**: NO (no test files for chat)
- **User wants tests**: Manual-only
- **Framework**: N/A

### Manual QA Only

Each TODO includes manual verification steps.

---

## Task Flow

```
Task 1 (type fix) ──┐
Task 2 (memory fix) ├──> Task 4 (verify all)
Task 3 (error boundary) ──┘
```

## Parallelization

| Group | Tasks | Reason                                         |
| ----- | ----- | ---------------------------------------------- |
| A     | 1, 2  | Both modify use-chat.ts but different sections |
| B     | 3     | Independent file                               |

| Task | Depends On | Reason                                  |
| ---- | ---------- | --------------------------------------- |
| 4    | 1, 2, 3    | Verification requires all fixes applied |

---

## TODOs

- [x] 1. Fix `as any` type assertion in use-chat.ts

  **What to do**:
  - Import `MessageDoc` from `@convex-dev/agent`
  - Import `ThreadMessagesQuery` from `@convex-dev/agent/react`
  - Replace `as any` with proper type assertion: `as ThreadMessagesQuery<Record<string, never>, MessageDoc>`
  - Remove the eslint-disable comment

  **Must NOT do**:
  - Don't change hook behavior
  - Don't add runtime type checking

  **Parallelizable**: YES (with 3)

  **References**:

  **Pattern References**:
  - `apps/teacher/src/spaces/document-editor/use-chat.ts:1-6` - Current imports to modify
  - `apps/teacher/src/spaces/document-editor/use-chat.ts:122-127` - The problematic code

  **Type References**:
  - `node_modules/@convex-dev/agent/dist/react/useThreadMessages.d.ts` - ThreadMessagesQuery definition
  - `node_modules/@convex-dev/agent/dist/validators.d.ts` - MessageDoc type

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `pnpm check-types --filter @app/teacher` → PASS (no type errors)
  - [ ] `grep -n "as any" apps/teacher/src/spaces/document-editor/use-chat.ts` → No matches
  - [ ] `grep -n "eslint-disable" apps/teacher/src/spaces/document-editor/use-chat.ts` → No matches for explicit-any

  **Commit**: YES
  - Message: `fix(teacher): replace as any with proper ThreadMessagesQuery type in useChat`
  - Files: `apps/teacher/src/spaces/document-editor/use-chat.ts`

---

- [x] 2. Fix memory leak - clear appliedMessageIds when thread changes

  **What to do**:
  - Add a useEffect that watches `threadId` changes
  - Clear `appliedMessageIds.current` when threadId changes
  - Also clear `operationResults` and `editResults` state maps when thread changes

  **Must NOT do**:
  - Don't clear on every render
  - Don't change the Set to state (refs are correct here)

  **Parallelizable**: YES (with 3)

  **References**:

  **Pattern References**:
  - `apps/teacher/src/spaces/document-editor/use-chat.ts:118-119` - The appliedMessageIds ref definition
  - `apps/teacher/src/spaces/document-editor/use-chat.ts:109-116` - operationResults and editResults state

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `pnpm check-types --filter @app/teacher` → PASS
  - [ ] Open lesson editor, open chat, send message
  - [ ] Switch to different thread
  - [ ] Verify no console errors about already-applied messages

  **Commit**: YES (groups with 1)
  - Message: `fix(teacher): clear chat state when switching threads to prevent memory leak`
  - Files: `apps/teacher/src/spaces/document-editor/use-chat.ts`

---

- [x] 3. Add error boundary to chat components

  **What to do**:
  - Create new file `apps/teacher/src/spaces/document-editor/chat-error-boundary.tsx`
  - Use React's error boundary pattern (class component or react-error-boundary if available)
  - Show friendly fallback UI: "Something went wrong with AI chat. Try refreshing."
  - Add reset button to retry
  - Wrap ChatMessages and ChatInput in the lesson editor route

  **Must NOT do**:
  - Don't add complex error recovery logic
  - Don't wrap the entire page (just chat area)
  - Don't show technical error details to users

  **Parallelizable**: YES (with 1, 2)

  **References**:

  **Pattern References**:
  - `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx:584-596` - Where to wrap with error boundary
  - `packages/ui/src/index.ts` - Check if ErrorBoundary component exists in UI package

  **External References**:
  - React Error Boundary docs: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `pnpm check-types --filter @app/teacher` → PASS
  - [ ] New file exists: `apps/teacher/src/spaces/document-editor/chat-error-boundary.tsx`
  - [ ] Open lesson editor → Chat sidebar works normally
  - [ ] (Optional) Temporarily throw error in ChatMessages → Fallback UI appears

  **Commit**: YES
  - Message: `feat(teacher): add error boundary to chat sidebar for crash protection`
  - Files: `apps/teacher/src/spaces/document-editor/chat-error-boundary.tsx`, `apps/teacher/src/routes/_protected/spaces.$id_.lesson.$lessonId.tsx`

---

- [x] 4. Verify all fixes work together

  **What to do**:
  - Run full type check
  - Run the app and test chat functionality
  - Verify no regressions

  **Parallelizable**: NO (depends on 1, 2, 3)

  **References**:
  - All modified files from previous tasks

  **Acceptance Criteria**:

  **Manual Execution Verification:**
  - [ ] `pnpm check-types` → PASS (full monorepo)
  - [ ] `pnpm dev:teacher` → App starts without errors
  - [ ] Open lesson → Open chat → Send message → Works
  - [ ] Switch threads → No errors, messages load correctly
  - [ ] Close/open chat → Works

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message                                                              | Files                                 | Verification     |
| ---------- | -------------------------------------------------------------------- | ------------------------------------- | ---------------- |
| 1+2        | `fix(teacher): improve type safety and memory management in useChat` | use-chat.ts                           | pnpm check-types |
| 3          | `feat(teacher): add error boundary to chat sidebar`                  | chat-error-boundary.tsx, lesson route | pnpm check-types |

---

## Success Criteria

### Verification Commands

```bash
pnpm check-types --filter @app/teacher  # Should pass
grep -n "as any" apps/teacher/src/spaces/document-editor/use-chat.ts  # No matches
```

### Final Checklist

- [x] No `as any` type assertions in chat code
- [x] Memory leak fixed with cleanup effect
- [x] Error boundary protects chat area
- [x] All type checks pass
- [x] Chat functionality works as before

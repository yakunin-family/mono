# Decisions: AI Chat Quick Fixes

## [2026-01-27] Type Assertion Approach

**Decision**: Use specific type assertion (`as ThreadMessagesQuery<...>`) instead of `as any`

**Rationale**:

- Codebase rule: No `as any` casts allowed
- Type assertion to specific type maintains some type safety
- The contract is verifiable: our backend query implements `ThreadMessagesQuery`
- TypeScript can still catch mismatches in the generic parameters

**Alternatives considered**:

1. ❌ Keep `as any` - Violates codebase rules
2. ❌ Create wrapper function - Adds unnecessary indirection
3. ✅ Type assertion to `ThreadMessagesQuery` - Best balance

---

## [2026-01-27] Error Boundary Scope

**Decision**: Wrap only chat content (ChatMessages + ChatInput), not entire sidebar

**Rationale**:

- Header and thread selector are simple, unlikely to fail
- If they fail, it's a different class of error (data loading, not rendering)
- Keeping thread selector outside boundary allows users to switch threads even if chat content fails
- More granular error isolation

**Alternatives considered**:

1. ❌ Wrap entire page - Too broad, would hide editor on chat failure
2. ❌ Wrap entire sidebar - Would hide thread selector on failure
3. ✅ Wrap only content area - Optimal isolation

---

## [2026-01-27] Cleanup Effect Dependencies

**Decision**: Use `[threadId]` as dependency for cleanup effect

**Rationale**:

- Cleanup should only run when thread changes
- Running on every render would clear state unnecessarily
- `threadId` is the natural boundary for chat state

**Alternatives considered**:

1. ❌ Empty deps `[]` - Would never cleanup, leak persists
2. ❌ Include all state - Would cleanup too often
3. ✅ Only `[threadId]` - Cleanup at right time

---

## [2026-01-27] Error Boundary Implementation

**Decision**: Use React class component, not external library

**Rationale**:

- No `react-error-boundary` library found in dependencies
- Class component pattern is standard React
- Simple use case doesn't need library features
- Avoids adding new dependency

**Alternatives considered**:

1. ❌ Add `react-error-boundary` library - Unnecessary dependency
2. ✅ Class component - Standard, no deps needed
3. ❌ Try/catch in components - Doesn't catch render errors

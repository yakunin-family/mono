---
status: todo
priority: low
description: Audit and add consistent error state handling across all query consumers
tags: [error-handling, ux]
---

# Add Consistent Error Handling Across Queries

Some components check for query errors while others don't. Add consistent error state handling across all query consumers, particularly in the dashboard index page for pendingInvitesQuery.

## Problem

Inconsistent error handling across components:

```typescript
// Component A - handles errors
const { data, isLoading, error } = useQuery(...);
if (error) return <ErrorState message={error.message} />;

// Component B - ignores errors
const { data, isLoading } = useQuery(...);
// error is ignored!
```

This leads to:

- Silent failures
- Inconsistent user experience
- Difficult debugging
- Potential broken UI states

## Solution

### 1. Audit All useQuery Calls

Search for all `useQuery` usage in the teacher app:

- Check if `error` or `isError` is destructured
- Check if error state is handled in the UI
- Document which components need updates

### 2. Create Consistent Error Display Pattern

```typescript
// Option A: Inline error state
function MyComponent() {
  const { data, isLoading, error } = useQuery(...);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Failed to load data. <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
}

// Option B: Reusable QueryErrorState component
function QueryErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-red-700">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-red-600 underline">
          Try again
        </button>
      )}
    </div>
  );
}
```

### 3. Priority Components

Focus on these areas first:

1. Dashboard index page (`pendingInvitesQuery`)
2. Space detail page
3. Lesson editor page
4. Any page that fetches critical data

## Acceptance Criteria

- [ ] Audit all `useQuery` calls for error handling
- [ ] Create list of components needing updates
- [ ] Add error states where missing
- [ ] Create consistent error display pattern (component or pattern)
- [ ] Ensure all critical queries have error handling
- [ ] Test error states by simulating failures

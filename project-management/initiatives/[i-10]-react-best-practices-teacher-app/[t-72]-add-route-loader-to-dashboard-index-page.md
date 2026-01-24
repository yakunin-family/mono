---
status: todo
priority: high
description: Add route loader to prefetch spaces and invites data in parallel
tags: [performance, data-fetching, ssr]
---

# Add Route Loader to Dashboard Index Page

Add a route loader to `apps/teacher/src/routes/_protected/_app/index.tsx` to prefetch spaces and invites data in parallel using `Promise.all()`. Currently the page has no loader and data only fetches after component mounts.

## Problem

The dashboard index page fetches data only after the component mounts:

```typescript
// Current - no loader, data fetches on mount
export const Route = createFileRoute("/_protected/_app/")({
  component: DashboardIndex,
  // No loader!
});

function DashboardIndex() {
  const spacesQuery = useQuery(...);  // Starts after render
  const invitesQuery = useQuery(...); // Starts after render
}
```

This creates:

1. Server renders shell
2. Client hydrates
3. Component mounts
4. Queries start fetching
5. Loading spinners show

## Solution

Add a loader that prefetches data during navigation:

```typescript
export const Route = createFileRoute("/_protected/_app/")({
  loader: async ({ context }) => {
    const { queryClient, convex } = context;

    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.spaces.listForUser, {})),
      queryClient.ensureQueryData(
        convexQuery(api.invites.getPendingForUser, {}),
      ),
    ]);
  },
  component: DashboardIndex,
});
```

Benefits:

1. Data fetches during route transition
2. Both queries run in parallel
3. Page renders with data already available
4. Better perceived performance

## Implementation Notes

- Use `ensureQueryData` to populate cache without blocking if cache exists
- Use `Promise.all` for parallel fetching
- Keep existing `useQuery` calls for reactivity and real-time updates
- Queries will use cached data from loader immediately

## Acceptance Criteria

- [ ] Add loader function using `ensureQueryData`
- [ ] Prefetch both spaces and invites in parallel
- [ ] Use preloaded data in component with fallback to query
- [ ] Test that loading states are reduced or eliminated
- [ ] Verify real-time updates still work after initial load

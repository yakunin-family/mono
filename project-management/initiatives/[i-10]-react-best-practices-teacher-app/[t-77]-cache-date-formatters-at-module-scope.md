---
status: todo
priority: medium
description: Cache Intl.DateTimeFormat instance at module scope for better performance
tags: [performance, javascript]
---

# Cache Date Formatters at Module Scope

In `apps/teacher/src/routes/_protected/_app/spaces.$id.tsx`, the `formatDate` function creates a new `Intl.DateTimeFormat` on each call. Cache the formatter at module scope for better performance.

## Problem

```typescript
// Current - new formatter created on every call
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
```

`Intl.DateTimeFormat` construction is expensive:

- Parses locale data
- Resolves options
- Creates internal state

If `formatDate` is called 100 times (e.g., in a table), that's 100 formatter constructions.

## Solution

Cache the formatter at module scope:

```typescript
// Module scope - created once
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}
```

Now 100 calls reuse the same formatter instance.

## Consider: Shared Date Utility

If date formatting is used across multiple files, consider creating a shared utility:

```typescript
// src/lib/date-utils.ts
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatShortDate(date: Date | number): string {
  return shortDateFormatter.format(date);
}

export function formatLongDate(date: Date | number): string {
  return longDateFormatter.format(date);
}
```

## Acceptance Criteria

- [ ] Create module-level DateTimeFormat instance
- [ ] Update formatDate to use cached formatter
- [ ] Evaluate if date formatting is used elsewhere
- [ ] If yes, consider creating shared `src/lib/date-utils.ts` utility
- [ ] No functional changes to displayed dates

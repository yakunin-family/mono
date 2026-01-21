---
status: todo
priority: medium
description: Build the context management system that captures user location and translates to agent-readable descriptions
tags: [backend, frontend, context]
---

# Implement Context Capture and Description Builder

Build the context management system that captures user location and translates it into agent-readable descriptions.

## Implementation

### 1. Context Description Helper

Create helper function in `convex/agent.ts`:

```typescript
async function buildContextDescription(
  ctx: ActionCtx,
  context: { type: string; id: string },
  teacherId: string
) {
  switch (context.type) {
    case "space":
      const space = await ctx.runQuery(internal.spaces.getSpace, {
        spaceId: context.id,
        teacherId,
      });
      return `Active space: ${space.language} with student ${space.studentName}`;

    case "document":
      const doc = await ctx.runQuery(internal.documents.getDocument, {
        documentId: context.id,
        teacherId,
      });
      return `Editing lesson: "${doc.title}" in space ${doc.spaceName}`;

    case "exercise_node":
      return `Focused on exercise node: ${context.id}`;

    default:
      return "Unknown context";
  }
}
```

### 2. Context Extraction in UI

Update `apps/teacher/src/routes/_protected/_app/route.tsx`:

```typescript
const context = useMemo(() => {
  if (location.pathname.includes("/spaces/")) {
    const spaceId = location.params.id;
    return { type: "space" as const, id: spaceId };
  }
  if (location.pathname.includes("/lesson/")) {
    const docId = location.params.lessonId;
    return { type: "document" as const, id: docId };
  }
  return undefined;
}, [location]);
```

## Acceptance Criteria

- [ ] Context description builder translates all context types
- [ ] Space context includes language and student name
- [ ] Document context includes lesson title and space
- [ ] Exercise node context handled (minimal for v1)
- [ ] UI extracts context from current route
- [ ] Context passed with every message to agent
- [ ] Graceful handling when context unavailable

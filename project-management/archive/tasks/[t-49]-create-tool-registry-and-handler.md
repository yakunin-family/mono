---
status: todo
priority: medium
description: Build the central tool registry that maps tool names to handlers with auth injection
tags: [backend, convex, tools]
---

# Create Tool Registry and Execution Handler

Build the central tool registry that maps tool names to handlers, and implement the execution layer with auth injection.

## Implementation

### 1. Tool Registry (`convex/tools/registry.ts`)

```typescript
export const TOOL_REGISTRY = [
  {
    name: "create_lesson",
    description: "Create a new lesson in a space with optional initial content",
    parameters: {
      type: "object",
      properties: {
        spaceId: { type: "string", description: "Space ID" },
        title: { type: "string", description: "Lesson title" },
        content: { type: "string", description: "Optional Tiptap JSON content" },
      },
      required: ["spaceId", "title"],
    },
    handler: internal.tools.document.createLesson,
  },
  // ... 14 more tools
];
```

### 2. Tool Execution Handler (`convex/tools/executor.ts`)

```typescript
export const executeToolCall = internalAction({
  args: {
    toolName: v.string(),
    toolArgs: v.any(),
    teacherId: v.string(),
  },
  handler: async (ctx, args) => {
    const tool = TOOL_REGISTRY.find(t => t.name === args.toolName);

    if (!tool) {
      throw new ConvexError(`Unknown tool: ${args.toolName}`);
    }

    try {
      // Execute with auth context injected
      const result = await tool.handler(ctx, {
        ...args.toolArgs,
        teacherId: args.teacherId,
      });

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        shouldRetry: error instanceof ConvexError,
      };
    }
  },
});
```

## Security

* All tool handlers must be `internal` functions (not client-exposed)
* `teacherId` automatically injected into every tool call
* Tools validate ownership before mutations
* Execution handler catches and sanitizes errors

## Acceptance Criteria

- [ ] Tool registry contains all 15 tools with proper schemas
- [ ] Execution handler routes tool calls to correct handlers
- [ ] Auth context (teacherId) injected automatically
- [ ] Error handling returns structured results to agent
- [ ] Unknown tool names throw clear errors
- [ ] All tool handlers are internal (not client-callable)

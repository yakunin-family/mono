---
status: todo
priority: high
description: Create document editor agent with loadSkill and editDocument tools
tags: [ai, editor]
references: blocked-by:t-103
---

# Define document editor agent with tools

Create the main document editor agent definition using Convex Agent Component.

## Requirements

1. Create `convex/agents/document-editor.ts`

2. Define `documentEditorAgent` using the Agent class:
   - Use GPT-4o-mini via Vercel AI SDK router
   - Configure with base system prompt from generated prompts
   - Set appropriate maxTokens and temperature

3. Implement `loadSkill` tool using `createTool`:
   - Accepts skill name parameter
   - Validates against known skill names
   - Returns skill content that gets added to context
   - Use Convex Agent's built-in context extension mechanism

4. Implement `editDocument` tool:
   - Accepts XML operations string
   - Validates XML is well-formed
   - Returns the operations to be applied client-side
   - Include proper error handling for malformed XML

## File

- `apps/backend/convex/agents/document-editor.ts`

## Code Pattern

```ts
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";


const loadSkill = createTool({
  name: "loadSkill",
  description: "Load specialized instructions for a skill",
  args: { skillName: v.string() },
  handler: async (ctx, args) => { ... }
});

const editDocument = createTool({
  name: "editDocument",
  description: "Apply XML operations to the document",
  args: { operations: v.string() },
  handler: async (ctx, args) => { ... }
});

export const documentEditorAgent = new Agent(components.agent, {
  model: openai("gpt-4o-mini"),
  tools: [loadSkill, editDocument],
  systemPrompt: buildChatBasePrompt(),
});
```

## Acceptance Criteria

- [ ] Agent defined with correct model configuration
- [ ] loadSkill tool validates and returns skill content
- [ ] editDocument tool validates XML and returns operations
- [ ] Agent can be instantiated without errors

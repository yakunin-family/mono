---
status: todo
priority: high
description: Create load_skill tool to dynamically load exercise instructions
tags: [ai, editor, streaming]
references: blocked-by:t-94
---

# Implement load_skill tool

Create the `load_skill` tool that allows the AI to load specialized instructions on demand.

## Requirements

1. Add tool definition to `apps/backend/convex/chat/tools.ts`
2. Define skill enum parameter with available skills
3. Load skill content from markdown files in `prompts/chat/skills/`
4. Return skill content as tool result (appends to LLM context)
5. Send `tool_start`/`tool_end` events with friendly display text

## Available Skills

| Skill Name          | Display Text                      |
| ------------------- | --------------------------------- |
| `fill-blanks`       | "Checking fill-blanks rules"      |
| `multiple-choice`   | "Checking multiple-choice rules"  |
| `true-false`        | "Checking true-false rules"       |
| `sequencing`        | "Checking sequencing rules"       |
| `short-answer`      | "Checking short-answer rules"     |
| `writing-exercises` | "Checking writing exercise rules" |

## Tool Definition

```typescript
load_skill: tool({
  description: "Load specialized instructions for creating specific types of exercises. Always use this before creating exercises to ensure correct formatting.",
  parameters: z.object({
    skill: z.enum([
      "fill-blanks",
      "multiple-choice",
      "true-false",
      "sequencing",
      "short-answer",
      "writing-exercises",
    ]).describe("The skill to load"),
  }),
  execute: async ({ skill }) => {
    // Load and return skill content
  },
}),
```

## SSE Events

```
event: tool_start
data: {"id":"tc_1","tool":"load_skill","args":{"skill":"fill-blanks"},"displayText":"Checking fill-blanks rules"}

event: tool_end
data: {"id":"tc_1","status":"success"}
```

## File

`apps/backend/convex/chat/tools.ts`

## Acceptance Criteria

- [ ] Tool has enum parameter for skill selection
- [ ] Skill content is loaded from markdown files
- [ ] Content is returned as tool result (becomes LLM context)
- [ ] `tool_start` shows friendly display text
- [ ] `tool_end` confirms success
- [ ] Error handling for missing skill files

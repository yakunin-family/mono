---
status: todo
priority: medium
description: AI chat agent stops after tool calls despite maxSteps configuration
tags: [bug, ai, convex-agent, editor]
---

# AI Chat agent stops after tool calls despite maxSteps configuration

## Problem

The document editor AI chat gets stuck after executing tool calls (like "Loading instructions" via the `loadSkill` tool). The agent should automatically continue to either call another tool (like `editDocument`) or generate a text response, but instead it stops and requires the user to send another message to "wake it up".

## Context

- Using `@convex-dev/agent@0.5.0-alpha.1` with a patch for `providerMetadata` validation
- Using `ai@5.0.82` (AI SDK)
- Added `maxSteps: 10` to `thread.streamText()` call in `apps/backend/convex/chat.ts` but it didn't help
- The agent correctly calls `loadSkill` tool and gets results, but doesn't continue processing
- User has to send follow-up messages like "hey" or "continue" to get the agent to proceed

## Relevant Files

- `apps/backend/convex/chat.ts` - sendMessage action with streamText call
- `apps/backend/convex/agents/documentEditor.ts` - Agent configuration
- `patches/@convex-dev__agent@0.5.0-alpha.1.patch` - Patch for providerMetadata

## Possible Causes to Investigate

1. The `maxSteps` parameter might not be working correctly with the agent wrapper
2. There might be an issue with how the agent package handles tool result continuations in the alpha version
3. The streaming/storage options might be interfering with multi-step execution
4. Could be related to the patched version having other issues

## Workaround

User can nudge the agent by sending follow-up messages like "hey" or "continue" to get it to proceed.

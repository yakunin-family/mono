---
status: todo
priority: low
description: Evaluate if i-xxx/t-xxx syntax is needed or flat IDs are simpler
tags: [tooling, project-management]
---

# Reconsider Reference Syntax

## Problem

The current reference system uses `i-xxx/t-xxx` syntax when referencing a task within an initiative. This adds cognitive overhead for both humans and AI agents.

An AI agent recently chose not to use this syntax, suggesting it may not be intuitive or convenient.

## Question

Should references just use flat IDs (`t-xxx`) that are resolved by searching across the entire `project-management/` folder?

## Considerations

### Current Approach (Hierarchical)
- `i-1/t-3` explicitly shows the task belongs to initiative 1
- Validates that the task actually exists in that initiative's folder
- More precise but more verbose

### Alternative (Flat IDs)
- `t-3` is simpler to write and remember
- Task IDs are already globally unique
- Tooling can resolve the path automatically
- Less cognitive load for AI agents

## Decision

TBD

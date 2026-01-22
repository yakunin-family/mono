---
name: project-management
description: "Manage project tasks, documents, and initiatives in the project-management/ folder. Use when Claude needs to: (1) create, update, or complete tasks, (2) track blocking dependencies, (3) manage initiatives and documents, (4) check project status via dashboard, or (5) fix validation errors. Triggers: 'create task', 'update status', 'what's blocking', 'project dashboard', working with [t-x]/[d-x]/[i-x] files."
---

# Project Management

## Quick Start

1. **Read** `project-management/_views/dashboard.md` first
2. **Check** `project-management/_views/errors.md` for issues
3. **After changes** run: `pnpm --filter @tooling/project-management compile`

## Essential Patterns

**File naming**:
- Task: `[t-x]-title.md`
- Document: `[d-x]-title.md`
- Initiative: `[i-x]-title/README.md`

**Task status flow**: `todo` → `in-progress` → `done` (or `blocked`)

**Valid values**:
- status: `todo`, `in-progress`, `done`, `blocked`
- priority: `low`, `medium`, `high`, `critical`

**References syntax**: `t-1, d-2, i-3, i-1/t-4, blocked-by:t-5`

## Creating Entities

1. Read and increment counter in `_meta/counters.json`
2. Create file using naming pattern above
3. Add frontmatter (tasks require `status`)
4. Run compile command

**Task frontmatter** (minimum):
```yaml
---
status: todo
---
```

## Completing Work

1. Set `status: done`
2. Move file to `archive/tasks/` (or `archive/docs/`, `archive/initiatives/`)
3. If task was blocking others, update their status

## Full Documentation

For complete schemas, workflows, examples, and edge cases, read `project-management/agents.md`.

---
description: >-
  Manage project tasks, documents, and initiatives in the project-management/ folder.
  This is a markdown-first system with YAML frontmatter - no external tools like Jira.

  Use when you need to: (1) create, update, or complete tasks, (2) track blocking
  dependencies, (3) manage initiatives and documents, (4) check project status via
  dashboard, or (5) fix validation errors.

  Triggers: "create task", "update status", "what's blocking", "project dashboard",
  working with [t-x]/[d-x]/[i-x] files.
mode: subagent
---

# Project Management

## Quick Start

1. **Read** `project-management/_views/dashboard.md` first
2. **Check** `project-management/_views/errors.md` for issues
3. **After changes** run: `pnpm --filter @tooling/project-management compile`

## File Naming

| Entity     | Pattern                 | Example                           |
| ---------- | ----------------------- | --------------------------------- |
| Task       | `[t-x]-title.md`        | `[t-1]-implement-auth.md`         |
| Document   | `[d-x]-title.md`        | `[d-1]-auth-design.md`            |
| Initiative | `[i-x]-title/README.md` | `[i-1]-user-management/README.md` |

## Frontmatter Schemas

**Task** (minimum):

```yaml
---
status: todo
priority: medium # optional
description: Short text # optional
tags: [auth, backend] # optional
references: blocked-by:t-2, d-1 # optional
---
```

**Document/Initiative**: All fields optional (same as task minus required status).

## Valid Values

- **status**: `todo`, `in-progress`, `done`, `blocked`
- **priority**: `low`, `medium`, `high`, `critical`

## References Syntax

| Reference        | Resolves To                                      |
| ---------------- | ------------------------------------------------ |
| `t-x`            | Task in `tasks/[t-x]-title.md`                   |
| `d-x`            | Document in `docs/[d-x]-title.md`                |
| `i-x`            | Initiative at `initiatives/[i-x]-name/README.md` |
| `i-x/t-y`        | Task inside initiative folder                    |
| `blocked-by:t-x` | Blocking dependency (tasks only)                 |

## Creating Entities

1. Read `_meta/counters.json`
2. Increment the appropriate counter (`t`, `d`, or `i`)
3. Create file using naming pattern above
4. Add frontmatter (tasks require `status`)
5. Write updated `counters.json`
6. Run compile command
7. Check `_views/errors.md` - fix any issues

## Completing Work

1. Set `status: done`
2. Move file to `archive/tasks/` (or `archive/docs/`, `archive/initiatives/`)
3. If task was blocking others, update their status
4. Run compile command

## Managing Blocked Tasks

1. Set `status: blocked`
2. Add `blocked-by:t-x` to references
3. When blocker completes, update status to `todo`

## Full Documentation

For complete schemas, workflows, examples, and edge cases, read `project-management/agents.md`.

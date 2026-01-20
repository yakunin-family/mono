---
name: project-management
description: "Use when working with tasks in project-management/ folder. Provides frontmatter schema, workflow rules, and dashboard guidance."
---

# Project Management System

A markdown-first task tracking system with YAML frontmatter validation.

## Before Any Changes

**ALWAYS do these first:**

1. Read `project-management/_views/dashboard.md` to understand current state
2. Check `project-management/_views/errors.md` if there are validation issues

For complete documentation, see `project-management/agents.md`.

## Task Frontmatter Schema

```yaml
---
id: task-001 # REQUIRED: Unique identifier
title: Implement feature X # REQUIRED: Short descriptive title
status: todo # REQUIRED: todo | in-progress | done | blocked
priority: high # OPTIONAL: low | medium | high | critical
assignee: john@example.com # OPTIONAL: Who's responsible
dueDate: 2026-01-31 # OPTIONAL: ISO date (YYYY-MM-DD)
tags: [frontend, react] # OPTIONAL: Categorization tags
blockedBy: [task-000] # OPTIONAL: Task IDs blocking this
initiative: feature-x # OPTIONAL: Initiative ID this belongs to
---
```

## Initiative Frontmatter Schema

```yaml
---
id: feature-x # REQUIRED: Unique identifier
title: Feature X Initiative # REQUIRED: Initiative name
status: in-progress # OPTIONAL: todo | in-progress | done | blocked
priority: high # OPTIONAL: low | medium | high | critical
owner: john@example.com # OPTIONAL: Initiative lead
---
```

## Valid Values

| Field    | Values                                   |
| -------- | ---------------------------------------- |
| status   | `todo`, `in-progress`, `done`, `blocked` |
| priority | `low`, `medium`, `high`, `critical`      |

## Key Workflows

**Creating a task:**

1. Create `.md` file in `project-management/tasks/` or `project-management/initiatives/<name>/`
2. Add frontmatter with required fields: `id`, `title`, `status`
3. Run `pnpm build` in `tooling/project-management` to validate and update dashboard

**Completing a task:**

1. Set `status: done`
2. Move file to `project-management/archive/tasks/`

**When blocked:**

1. Set `status: blocked`
2. Add `blockedBy: [task-id]` listing blocker IDs

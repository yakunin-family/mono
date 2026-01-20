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

## File Naming Convention

ID and title are derived from filename — not stored in frontmatter:

| Entity     | Pattern                      | Example                              |
| ---------- | ---------------------------- | ------------------------------------ |
| Task       | `[t-x]-title.md`             | `[t-1]-implement-auth.md`            |
| Document   | `[d-x]-title.md`             | `[d-1]-auth-design.md`               |
| Initiative | `[i-x]-title/README.md`      | `[i-1]-user-management/README.md`    |

When creating new entities, increment the counter in `_meta/counters.json`.

## Task Frontmatter Schema

```yaml
---
status: todo              # REQUIRED: todo | in-progress | done | blocked
priority: medium          # optional: low | medium | high | critical
description: Short text   # optional: for dashboard display
tags: [auth, backend]     # optional: categorization
references: blocked-by:t-2, d-1  # optional: relationships
---
```

## Document Frontmatter Schema

```yaml
---
description: Short text   # optional: for documents view
tags: [design, api]       # optional: categorization
references: t-1, i-2      # optional: relationships
---
```

## Initiative Frontmatter Schema

```yaml
---
status: in-progress       # optional: todo | in-progress | done | blocked
priority: high            # optional: low | medium | high | critical
description: Short text   # optional: for dashboard display
tags: [frontend]          # optional: categorization
references: d-1, t-5      # optional: relationships
---
```

## References Syntax

```yaml
references: blocked-by:t-1, t-2, d-1, i-1, i-1/t-3
```

- `t-x` — Task in `tasks/`
- `d-x` — Document in `docs/`
- `i-x` — Initiative
- `i-x/t-y` — Task inside initiative folder
- `blocked-by:` prefix — Marks blocking dependency (tasks only)

## Valid Values

| Field    | Values                                   |
| -------- | ---------------------------------------- |
| status   | `todo`, `in-progress`, `done`, `blocked` |
| priority | `low`, `medium`, `high`, `critical`      |

## Key Workflows

**Creating a task:**

1. Read and increment counter in `_meta/counters.json`
2. Create file: `tasks/[t-x]-your-title.md` (or in `initiatives/[i-x]-name/`)
3. Add frontmatter with `status` (required)
4. Run `pnpm --filter @tooling/project-management compile`

**Completing a task:**

1. Set `status: done`
2. Move file to `archive/tasks/`

**When blocked:**

1. Set `status: blocked`
2. Add `references: blocked-by:t-x` with blocker IDs

# Project Management: Documents & Unified Reference System

**Date:** 2026-01-20
**Status:** Approved

## Overview

This design expands the project management tooling to support documents alongside tasks and initiatives. It also introduces a unified file naming convention, global ID counter system, and universal reference syntax across all entity types.

## Goals

- Add document support with similar capabilities to tasks
- Simplify and unify file naming across all entities
- Create a universal reference system for linking between entities
- Improve validation and error reporting

## File Naming Convention

All entities use a consistent `[prefix-id]-title` pattern:

```
[t-1]-implement-auth.md          # Task
[d-1]-auth-design.md             # Document
[i-1]-user-management/README.md  # Initiative (folder)
```

**Rules:**
- Prefix: `t-` for tasks, `d-` for documents, `i-` for initiatives
- ID: Sequential integer managed by counter file
- Title: kebab-case, descriptive
- No `id` or `title` in frontmatter — derived from filename
- Tooling parses filename to extract both values

**Title display:** Convert kebab-case to title case for dashboard (e.g., `implement-auth` → "Implement Auth")

## Frontmatter Schemas

### Task (`[t-x]-title.md`)

```yaml
---
status: todo              # required: todo | in-progress | done | blocked
priority: medium          # optional: low | medium | high | critical
description: Short text   # optional: for dashboard display
tags: [auth, backend]     # optional: categorization
references: blocked-by:t-2, d-1  # optional: relationships
---
```

### Document (`[d-x]-title.md`)

```yaml
---
description: Short text   # optional: for documents view
tags: [design, api]       # optional: categorization
references: t-1, i-2      # optional: relationships
---
```

### Initiative (`[i-x]-title/README.md`)

```yaml
---
status: in-progress       # optional: todo | in-progress | done | blocked
priority: high            # optional: low | medium | high | critical
description: Short text   # optional: for dashboard display
tags: [frontend]          # optional: categorization
references: d-1, t-5      # optional: relationships
---
```

**Note:** All frontmatter is optional for documents. Tasks require `status`. Initiatives have all optional fields.

## References System

### Syntax

```yaml
references: blocked-by:i-1/t-3, t-1, d-2, i-1
```

### Reference Types

- `t-x` – task in `tasks/[t-x]-title.md`
- `i-x/t-y` – task in `initiatives/[i-x]-name/[t-y]-title.md`
- `d-x` – document in `docs/[d-x]-title.md`
- `i-x` – initiative at `initiatives/[i-x]-name/README.md`

### Relationship Prefixes

- `blocked-by:t-x` or `blocked-by:i-x/t-y` – this task is blocked by another task (only valid for tasks)
- No prefix – informational link (any entity can reference any other)

### Behavior

- References are unidirectional (no automatic back-links)
- Validation checks all referenced IDs exist
- Invalid references reported in `errors.md`
- Dashboard shows blockers for blocked tasks with their status
- `i-x/t-y` validates that task `t-y` actually exists inside initiative `i-x`'s folder

### Examples

```yaml
# Referencing a standalone task
references: t-5

# Referencing a task inside an initiative
references: blocked-by:i-1/t-3, d-1

# Mixed references
references: t-1, i-2/t-7, d-2, i-3
```

## Counter File

### Location

`_meta/counters.json`

### Format

```json
{
  "t": 12,
  "d": 5,
  "i": 3
}
```

### Behavior

- Each value represents the last assigned ID for that prefix
- When creating a new entity: read counter, increment appropriate value, use new value, write back
- Counters only go up — never reuse IDs even after deletion
- Validation flags if any file ID exceeds its counter (indicates manual file creation without updating counter)

### Initialization

```json
{
  "t": 0,
  "d": 0,
  "i": 0
}
```

## Folder Structure

```
project-management/
├── tasks/                      # Active tasks
│   └── [t-1]-implement-auth.md
├── docs/                       # Active documents
│   └── [d-1]-auth-design.md
├── initiatives/                # Active initiatives
│   └── [i-1]-user-management/
│       ├── README.md
│       └── [t-2]-setup-db.md   # Tasks can live inside initiatives
├── archive/                    # Completed/deprecated items
│   ├── tasks/
│   ├── docs/
│   └── initiatives/
├── _meta/                      # System files
│   └── counters.json
├── _views/                     # Auto-generated (never edit)
│   ├── dashboard.md
│   ├── documents.md
│   └── errors.md
└── agents.md                   # AI agent instructions
```

### Rules

- Tasks can live in `tasks/` OR inside an initiative folder
- Documents only live in `docs/` (not inside initiatives)
- Archived items maintain their original filename
- `_views/` regenerates on every build

## Validation Rules

Errors are reported in `_views/errors.md`:

### 1. Filename Format

```
Error: Invalid filename format
File: tasks/my-task.md
Expected: [t-x]-title.md pattern
```

### 2. Duplicate IDs

```
Error: Duplicate ID
ID: t-1
Files: tasks/[t-1]-auth.md, initiatives/[i-1]-feature/[t-1]-other.md
```

### 3. Invalid References

```
Error: Reference not found
File: tasks/[t-5]-login.md
Reference: t-99 does not exist
```

### 4. Invalid Enum Values

```
Error: Invalid status
File: tasks/[t-3]-setup.md
Field: status
Received: "pending"
Expected: todo | in-progress | done | blocked
```

### 5. Counter Mismatch

```
Error: ID exceeds counter
File: tasks/[t-50]-feature.md
Counter value: t=12
Action: Update counters.json or rename file
```

## Generated Views

### `_views/dashboard.md`

Main project overview:
- Summary stats (total tasks, by status)
- In Progress tasks
- High Priority Todo
- Blocked Tasks (shows blockers with their status)
- Initiatives table (with progress %)
- Recently Completed
- Other Tasks

### `_views/documents.md`

Simple table of contents:

```markdown
# Documents

**Last Updated:** 2026-01-20T10:30:00Z

| ID | Title | Description | Tags |
|----|-------|-------------|------|
| [d-1](../docs/[d-1]-auth-design.md) | Auth Design | Authentication flow design | design, auth |
| [d-2](../docs/[d-2]-api-reference.md) | API Reference | REST API documentation | api, reference |
```

### `_views/errors.md`

Validation errors report (as described in Validation Rules section).

**Regeneration:** All views regenerate on every build/watch. Never edit manually.

## Agent Workflow

### Creating a New Task

1. Read `_meta/counters.json`
2. Increment the `t` counter
3. Create file: `tasks/[t-x]-title.md` or `initiatives/[i-y]-name/[t-x]-title.md`
4. Write updated `counters.json`
5. Check `_views/errors.md` after build

### Creating a New Document

1. Read `_meta/counters.json`
2. Increment the `d` counter
3. Create file: `docs/[d-x]-title.md`
4. Write updated `counters.json`
5. Check `_views/errors.md` after build

### Creating a New Initiative

1. Read `_meta/counters.json`
2. Increment the `i` counter
3. Create folder: `initiatives/[i-x]-title/`
4. Create file: `initiatives/[i-x]-title/README.md`
5. Write updated `counters.json`
6. Check `_views/errors.md` after build

### Completing Work

1. Set `status: done` in frontmatter (for tasks/initiatives)
2. Move file/folder to `archive/` maintaining the filename
3. Check `_views/errors.md` after build

**Always:** Check `_views/errors.md` after any modification to ensure validation passes.

## Implementation

### Files to Modify

- `tooling/project-management/src/types.ts` – Update type definitions
- `tooling/project-management/src/collector.ts` – Parse new filename format, collect documents
- `tooling/project-management/src/generator.ts` – Generate documents view, update dashboard
- `tooling/project-management/src/utils.ts` – Add filename parsing, reference validation
- `project-management/agents.md` – Update agent instructions

### Files to Create

- `project-management/_meta/counters.json` – Initialize counter file
- `project-management/docs/` – Create documents directory

### Files to Remove

- `project-management/tasks/example-task.md`
- `project-management/tasks/example-task-1.md`
- `project-management/initiatives/example-initiative/` (entire folder)

## Migration

Clean break approach: Remove existing example files and start fresh with the new format. No migration script needed since only example files exist.

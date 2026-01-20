# AI Agent Guide for Project Management System

## Overview

This is a **markdown-first project management system** that uses plain markdown files with YAML frontmatter to track tasks, documents, and initiatives. All data lives in markdown files — there's no separate database or API.

**This folder is the canonical place for:**
- Project plans and designs
- Implementation details
- Task tracking
- Reference documentation

**Key Features:**
- Unified file naming convention: `[prefix-id]-title` pattern
- ID and title derived from filename (not stored in frontmatter)
- Global counter system for sequential IDs
- Universal reference syntax for linking between entities

## CRITICAL: Compile After Every Change

After making **any changes** to files in `project-management/`, you **MUST**:

1. Run the compile command:
   ```bash
   pnpm --filter @tooling/project-management compile
   ```

2. Check `_views/errors.md` for validation errors

3. **If errors exist, fix them immediately** — continue working until `errors.md` shows "All Clear"

The compile command exits with code 1 if there are errors, making it easy to detect failures.

## Important: Start with the Dashboard

**ALWAYS read `_views/dashboard.md` FIRST** before making any changes. The dashboard provides:
- Current state of all tasks and initiatives
- What's in progress, blocked, or high priority
- Recently completed work
- Task relationships and dependencies

Reading the dashboard helps you understand the project context before modifying any files.

**Check `_views/errors.md`** if there are validation issues. This file shows:
- Files with invalid filename format
- Duplicate IDs across files
- Invalid or missing references
- Invalid enum values (status, priority)
- Counter mismatches

## File Structure

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

**Key Principles:**
- **tasks/**: Standalone tasks not tied to initiatives
- **docs/**: Documents (design docs, references, guides)
- **initiatives/**: Folders containing related tasks and README
- **archive/**: Move completed work here (maintains original filename)
- **_meta/**: System files like counters.json
- **_views/**: Never edit manually — regenerated on every build

## File Naming Convention

All entities use a consistent `[prefix-id]-title` pattern:

| Entity | Pattern | Example |
|--------|---------|---------|
| Task | `[t-x]-title.md` | `[t-1]-implement-auth.md` |
| Document | `[d-x]-title.md` | `[d-1]-auth-design.md` |
| Initiative | `[i-x]-title/README.md` | `[i-1]-user-management/README.md` |

**Rules:**
- Prefix: `t-` for tasks, `d-` for documents, `i-` for initiatives
- ID: Sequential integer managed by counter file
- Title: kebab-case, descriptive
- **No `id` or `title` in frontmatter** — derived from filename
- Tooling converts kebab-case to title case for display (e.g., `implement-auth` → "Implement Auth")

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

**Field Details:**
- **status** (required): Current state of the task
  - `todo`: Not started yet
  - `in-progress`: Currently being worked on
  - `done`: Completed (move to `archive/` when done)
  - `blocked`: Waiting on dependencies
- **priority** (optional): Urgency level. High/critical tasks appear in dedicated dashboard sections.
- **description** (optional): Brief summary shown in dashboard tables.
- **tags** (optional): Free-form categorization (e.g., `[backend, api, database]`).
- **references** (optional): Links to other entities and blocking relationships.

### Document (`[d-x]-title.md`)

```yaml
---
description: Short text   # optional: for documents view
tags: [design, api]       # optional: categorization
references: t-1, i-2      # optional: relationships
---
```

**Note:** All frontmatter is optional for documents.

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

**Note:** All frontmatter is optional for initiatives.

## References System

### Syntax

```yaml
references: blocked-by:i-1/t-3, t-1, d-2, i-1
```

### Reference Types

| Reference | Resolves To |
|-----------|-------------|
| `t-x` | Task in `tasks/[t-x]-title.md` |
| `i-x/t-y` | Task in `initiatives/[i-x]-name/[t-y]-title.md` |
| `d-x` | Document in `docs/[d-x]-title.md` |
| `i-x` | Initiative at `initiatives/[i-x]-name/README.md` |

### Relationship Prefixes

- `blocked-by:t-x` or `blocked-by:i-x/t-y` — This task is blocked by another task (only valid for tasks)
- No prefix — Informational link (any entity can reference any other)

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

- Each value represents the **last assigned ID** for that prefix
- When creating a new entity: read counter, increment appropriate value, use new value, write back
- **Counters only go up** — never reuse IDs even after deletion
- Validation flags if any file ID exceeds its counter (indicates manual file creation without updating counter)

### Initialization

For a new project:

```json
{
  "t": 0,
  "d": 0,
  "i": 0
}
```

## How to Create Entities

### Creating a New Task

1. Read `_meta/counters.json`
2. Increment the `t` counter (e.g., 5 → 6)
3. Create file: `tasks/[t-6]-your-task-title.md` or `initiatives/[i-x]-name/[t-6]-title.md`
4. Add frontmatter with at minimum `status`
5. Write updated `counters.json`
6. Check `_views/errors.md` after build

**Example:**

```markdown
---
status: todo
priority: medium
tags: [ui, accessibility]
---

## Description

Implement a dark mode toggle in the settings page.

## Acceptance Criteria

- [ ] Toggle button in settings
- [ ] Persists preference in localStorage
- [ ] Applies theme across all pages
```

### Creating a New Document

1. Read `_meta/counters.json`
2. Increment the `d` counter
3. Create file: `docs/[d-x]-your-document-title.md`
4. Add optional frontmatter
5. Write updated `counters.json`
6. Check `_views/errors.md` after build

**Example:**

```markdown
---
description: REST API endpoint documentation
tags: [api, reference]
references: t-3, i-1
---

## Overview

This document describes the REST API endpoints...
```

### Creating a New Initiative

1. Read `_meta/counters.json`
2. Increment the `i` counter
3. Create folder: `initiatives/[i-x]-your-initiative-name/`
4. Create file: `initiatives/[i-x]-your-initiative-name/README.md`
5. Write updated `counters.json`
6. Check `_views/errors.md` after build

**Example README.md:**

```markdown
---
status: in-progress
priority: high
description: Add comprehensive user profile management
tags: [frontend, profile, settings]
references: d-1
---

## Overview

This initiative adds full user profile management including viewing, editing, and avatar uploads.

## Goals

- Allow users to view and edit profile information
- Support avatar uploads
- Add privacy settings

## Success Criteria

- [ ] Profile viewing works
- [ ] Profile editing works
- [ ] Avatar upload works
- [ ] Privacy settings implemented
- [ ] Tests passing
```

## How to Update Tasks

**Edit the frontmatter fields:**

1. Open the task markdown file
2. Update the fields in the YAML frontmatter
3. Most common update: changing `status`
4. Save the file

**Example status progression:**

```yaml
# Starting work
status: todo → status: in-progress

# Completing work
status: in-progress → status: done

# Getting blocked
status: in-progress → status: blocked
references: blocked-by:t-5
```

## How to Complete Work

**When a task is done:**

1. Set `status: done` in the frontmatter
2. Move the file to `archive/tasks/` (maintain original filename)
3. The dashboard will show it in "Recently Completed" (last 7 days)

**Example:**

```bash
# Move completed task to archive
mv tasks/[t-6]-dark-mode-toggle.md archive/tasks/
```

**When a document is no longer needed:**

1. Move the file to `archive/docs/`

**When an initiative is done:**

1. Set `status: done` in the initiative's README frontmatter
2. Move all associated tasks to `archive/tasks/`
3. Move the initiative folder to `archive/initiatives/`

## Blocking Relationships

**How blocks work:**

- Use `blocked-by:t-x` in references to indicate this task is blocked
- Set `status: blocked` to show the task is waiting
- Tasks with `status: blocked` appear in "Blocked Tasks" section of dashboard

**Example:**

```markdown
<!-- Task A: [t-1]-design-api-schema.md -->
---
status: in-progress
priority: high
---

## Description
Design the API schema for the new feature.


<!-- Task B: [t-2]-implement-api.md -->
---
status: blocked
references: blocked-by:t-1
---

## Description
Implement API endpoints based on the schema.


<!-- Task C: [t-3]-create-api-docs.md -->
---
status: blocked
references: blocked-by:t-1, d-2
---

## Description
Create API documentation based on the schema.
```

When Task A (t-1) completes:
1. Set `[t-1]-design-api-schema.md` to `status: done`
2. Update `[t-2]-implement-api.md` and `[t-3]-create-api-docs.md` to `status: todo`
3. Optionally remove the `blocked-by` reference or keep for historical tracking

## Example Files

**Standalone Task:**

```markdown
<!-- File: tasks/[t-42]-fix-login-redirect.md -->
---
status: in-progress
priority: critical
description: Users redirected to 404 after login
tags: [bug, auth, frontend]
---

## Problem

Users are redirected to 404 after successful login instead of dashboard.

## Root Cause

Route guard not checking authentication state correctly.

## Solution

Update `AuthGuard.tsx` to await auth check before redirecting.
```

**Task in Initiative:**

```markdown
<!-- File: initiatives/[i-1]-user-profiles/[t-43]-create-profile-component.md -->
---
status: todo
priority: high
tags: [frontend, react, profile]
references: blocked-by:i-1/t-42
---

## Description

Build reusable profile component for displaying user info.

## Requirements

- Avatar with fallback initials
- Display name and email
- Edit button (links to settings)
- Responsive design
```

**Document:**

```markdown
<!-- File: docs/[d-1]-auth-design.md -->
---
description: Authentication flow design
tags: [design, auth, security]
references: t-1, i-1
---

## Overview

This document describes the authentication architecture...

## Flow Diagram

...
```

## Tips for AI Agents

1. **Run compile after every change** — this is mandatory, not optional
2. **Fix all errors before moving on** — keep working until errors.md shows "All Clear"
3. **Always read dashboard first** (`_views/dashboard.md`)
4. **Don't edit generated files** in `_views/`
5. **Always update counters.json** when creating new entities
6. **Keep titles descriptive** in filenames (converted to title case for display)
7. **Update status frequently** to reflect current state
8. **Use `blocked-by:`** prefix in references to track dependencies
9. **Archive completed work** to keep active views clean
10. **Set priorities** to help with triage and planning
11. **Use references** to link related entities for context
12. **Use initiatives** for multi-task features

## Common Workflows

**Starting new work:**
1. Read dashboard to understand current priorities
2. Read `_meta/counters.json`
3. Increment appropriate counter
4. Create file with new ID and `status: todo`
5. Write updated `counters.json`
6. Update status to `in-progress` when starting
7. Run compile and verify no errors

**Completing work:**
1. Update entity to `status: done`
2. Move file to appropriate `archive/` subfolder
3. If task was blocking others, update their status
4. Run compile and verify no errors

**Managing blocked tasks:**
1. Set task to `status: blocked`
2. Add `blocked-by:t-x` to references
3. Run compile
4. Check dashboard's "Blocked Tasks" section
5. When blocker completes, update status to `todo`

**Working with initiatives:**
1. Create initiative folder with README
2. Create tasks inside the initiative folder
3. Reference initiative tasks using `i-x/t-y` syntax
4. Run compile and verify no errors
5. Track progress via dashboard's "Initiatives" section
6. When complete, archive both tasks and initiative folder

**Fixing validation errors:**
1. Run compile to see current issues
2. Check `_views/errors.md` for details
3. Fix the issue as indicated (filename format, missing field, invalid reference, etc.)
4. Run compile again — repeat until "All Clear"

## System Behavior

- **Auto-generation**: Dashboard, documents.md, and errors.md regenerate on every compile
- **Validation**: Filenames and frontmatter are validated with detailed error messages
- **Exit codes**: Compile exits with code 1 if there are validation errors
- **Sorting**: Tasks sorted by priority, then title
- **Filtering**: Archived items excluded from active views
- **Progress tracking**: Initiatives show completion percentage

## Valid Values Reference

### status
`todo` | `in-progress` | `done` | `blocked`

### priority
`low` | `medium` | `high` | `critical`

### Reference Prefixes
`blocked-by:` (tasks only) | (no prefix for informational links)

### Reference Formats
`t-x` | `d-x` | `i-x` | `i-x/t-y`

## Questions?

Refer to the generated dashboard and explore existing tasks/initiatives/documents as examples.

# AI Agent Guide for Project Management System

## Overview

This is a **markdown-first project management system** that uses plain markdown files with YAML frontmatter to track tasks and initiatives. All data lives in markdown files — there's no separate database or API.

## Important: Start with the Dashboard

**ALWAYS read `_views/dashboard.md` FIRST** before making any changes. The dashboard provides:
- Current state of all tasks and initiatives
- What's in progress, blocked, or high priority
- Recently completed work
- Task relationships and dependencies

Reading the dashboard helps you understand the project context before modifying any files.

**Check `_views/errors.md`** if there are validation issues. This file shows:
- Files with invalid frontmatter
- Specific field errors with received vs expected values
- Valid values reference for all enum fields

## File Structure

```
project-management/
├── tasks/                  # Individual task files
│   ├── task-001-feature.md
│   ├── task-002-bugfix.md
│   └── ...
├── initiatives/            # Initiative folders (epics/projects)
│   ├── feature-x/
│   │   ├── README.md      # Initiative overview
│   │   └── ...
│   └── ...
├── archive/                # Completed items
│   ├── tasks/
│   └── initiatives/
└── _views/                 # Generated reports (auto-generated)
    ├── dashboard.md       # Main project overview
    └── errors.md          # Validation errors report
```

**Key Principles:**
- **tasks/**: Standalone tasks not tied to initiatives
- **initiatives/**: Folders containing related tasks and README
- **archive/**: Move completed work here
- **_views/**: Never edit manually — regenerated on every build

## Task Frontmatter Schema

Every task is a markdown file with YAML frontmatter at the top:

```yaml
---
id: task-001                    # REQUIRED: Unique task identifier
title: Implement feature X      # REQUIRED: Short descriptive title
status: todo                    # REQUIRED: todo | in-progress | done | blocked
priority: high                  # OPTIONAL: low | medium | high | critical
assignee: john@example.com      # OPTIONAL: Who's responsible
dueDate: 2026-01-31            # OPTIONAL: ISO date format (YYYY-MM-DD)
tags: [frontend, react]        # OPTIONAL: Categorization tags
blockedBy: [task-000]          # OPTIONAL: Array of task IDs blocking this task
blocks: [task-002]             # OPTIONAL: Array of task IDs this task blocks
relatedTo: [task-003]          # OPTIONAL: Array of related task IDs
initiative: feature-x          # OPTIONAL: Initiative ID this task belongs to
---

## Description

Task details, acceptance criteria, implementation notes, etc.
```

**Field Details:**

- **id**: Unique identifier (e.g., `task-001`, `feat-login`). Used for cross-references.
- **title**: Concise summary shown in dashboards and lists.
- **status**:
  - `todo`: Not started yet
  - `in-progress`: Currently being worked on
  - `done`: Completed (move to `archive/` when done)
  - `blocked`: Waiting on dependencies or external factors
- **priority**: Urgency level. High/critical tasks appear in dedicated dashboard sections.
- **assignee**: Email or username of responsible person.
- **dueDate**: ISO 8601 date format (`YYYY-MM-DD`).
- **tags**: Free-form categorization (e.g., `[backend, api, database]`).
- **blockedBy**: List of task IDs that must complete before this task can proceed.
- **blocks**: List of task IDs that depend on this task completing.
- **relatedTo**: Informational links to related tasks.
- **initiative**: Links task to an initiative folder (use initiative ID).

## Initiative Frontmatter Schema

Initiatives group related tasks into epics or projects:

```yaml
---
id: init-001                     # REQUIRED: Unique initiative identifier
title: Feature X Initiative      # REQUIRED: Initiative name
description: Short summary       # OPTIONAL: Brief description
status: in-progress              # OPTIONAL: Same as task status
priority: high                   # OPTIONAL: Same as task priority
owner: john@example.com          # OPTIONAL: Initiative lead
startDate: 2026-01-01           # OPTIONAL: ISO date format
targetDate: 2026-02-28          # OPTIONAL: Target completion date
tags: [frontend]                # OPTIONAL: Categorization tags
---

## Overview

Detailed initiative description, goals, and success criteria.
```

## How to Create Tasks

**Just create a markdown file with frontmatter:**

1. Create a new `.md` file in `tasks/` or `initiatives/<name>/`
2. Add YAML frontmatter at the top (between `---` markers)
3. Include at minimum: `id`, `title`, and `status`
4. Add task description below the frontmatter
5. Save the file

**Example:**

```markdown
---
id: task-123
title: Add dark mode toggle
status: todo
priority: medium
assignee: alice@example.com
tags: [ui, accessibility]
---

## Description

Implement a dark mode toggle in the settings page.

## Acceptance Criteria

- [ ] Toggle button in settings
- [ ] Persists preference in localStorage
- [ ] Applies theme across all pages
```

The next time the dashboard builds, this task will appear automatically.

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
```

## How to Complete Work

**When a task is done:**

1. Set `status: done` in the frontmatter
2. Move the file to `archive/tasks/`
3. The dashboard will show it in "Recently Completed" (last 7 days)

**Example:**

```bash
# Move completed task to archive
mv tasks/task-123-feature.md archive/tasks/
```

**When an initiative is done:**

1. Set `status: done` in the initiative's README frontmatter
2. Move all associated tasks to `archive/tasks/`
3. Move the initiative folder to `archive/initiatives/`

## Blocking Relationships

**How blocks work:**

- `blockedBy`: "I'm blocked by these tasks"
- `blocks`: "I'm blocking these tasks"
- Tasks with `status: blocked` appear in "Blocked Tasks" section of dashboard

**Example:**

```yaml
# Task A (task-001)
---
id: task-001
title: Design API schema
status: in-progress
blocks: [task-002, task-003]
---

# Task B (task-002)
---
id: task-002
title: Implement API endpoints
status: blocked
blockedBy: [task-001]
---

# Task C (task-003)
---
id: task-003
title: Create API documentation
status: blocked
blockedBy: [task-001]
---
```

When Task A completes:
1. Set `task-001` to `status: done`
2. Update `task-002` and `task-003` to `status: todo`
3. Remove `blockedBy` from dependent tasks (or keep for historical tracking)

## Example Task Files

**Standalone Task:**

```markdown
---
id: task-042
title: Fix login redirect bug
status: in-progress
priority: critical
assignee: bob@example.com
dueDate: 2026-01-20
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
---
id: feat-x-001
title: Create user profile component
status: todo
priority: high
assignee: alice@example.com
initiative: feature-x
tags: [frontend, react, profile]
blockedBy: [feat-x-000]
---

## Description

Build reusable profile component for displaying user info.

## Requirements

- Avatar with fallback initials
- Display name and email
- Edit button (links to settings)
- Responsive design
```

## Example Initiative README

```markdown
---
id: feature-x
title: Feature X Initiative
description: Add comprehensive user profile management
status: in-progress
priority: high
owner: alice@example.com
startDate: 2026-01-10
targetDate: 2026-02-15
tags: [frontend, profile, settings]
---

## Overview

This initiative adds full user profile management including viewing, editing, and avatar uploads.

## Goals

- Allow users to view and edit profile information
- Support avatar uploads
- Add privacy settings

## Tasks

See dashboard for linked tasks with `initiative: feature-x`

## Success Criteria

- [ ] Profile viewing works
- [ ] Profile editing works
- [ ] Avatar upload works
- [ ] Privacy settings implemented
- [ ] Tests passing
```

## Tips for AI Agents

1. **Always read dashboard first** (`_views/dashboard.md`)
2. **Check errors.md** for validation issues (`_views/errors.md`)
3. **Don't edit generated files** in `_views/`
4. **Use consistent IDs** (e.g., `task-001`, `feat-login-002`)
5. **Keep titles concise** (shown in tables)
6. **Update status frequently** to reflect current state
7. **Use `blockedBy`** to track dependencies
8. **Archive completed work** to keep active views clean
9. **Set priorities** to help with triage and planning
10. **Link related tasks** via `relatedTo` for context
11. **Use initiatives** for multi-task features

## Common Workflows

**Starting new work:**
1. Read dashboard to understand current priorities
2. Create task file with `status: todo`
3. Update status to `in-progress` when starting
4. Update dashboard to see new task appear

**Completing work:**
1. Update task to `status: done`
2. Move file to `archive/tasks/`
3. If task was blocking others, update their status
4. Rebuild dashboard to reflect changes

**Managing blocked tasks:**
1. Set task to `status: blocked`
2. Add `blockedBy: [task-id]` with blocker IDs
3. Check dashboard's "Blocked Tasks" section
4. When blocker completes, update status to `todo`

**Working with initiatives:**
1. Create initiative folder with README
2. Create tasks with `initiative: <id>` field
3. Track progress via dashboard's "Initiatives" section
4. When complete, archive both tasks and initiative folder

**Fixing validation errors:**
1. Check `_views/errors.md` for current issues
2. Open the file with errors
3. Fix the frontmatter fields as indicated
4. Rebuild to verify the fix

## System Behavior

- **Auto-generation**: Dashboard and errors.md regenerate on every build/watch
- **File watching**: Changes trigger automatic rebuild in watch mode
- **Validation**: Frontmatter is validated with detailed error messages
- **Sorting**: Tasks sorted by priority, then title
- **Filtering**: Archived items excluded from active views
- **Progress tracking**: Initiatives show completion percentage

## Valid Values Reference

### status
`todo` | `in-progress` | `done` | `blocked`

### priority
`low` | `medium` | `high` | `critical`

## Questions?

Refer to the generated dashboard and explore existing tasks/initiatives as examples.

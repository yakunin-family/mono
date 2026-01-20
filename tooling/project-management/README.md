# @tooling/project-management

A markdown-first project management tool for tracking tasks and initiatives.

## Overview

This package provides a CLI tool that:
- Collects tasks and initiatives from markdown files
- Generates dashboard views and reports
- Auto-generates AI agent documentation (`agents.md`)
- Watches for file changes in development mode
- Validates frontmatter structure

## Structure

```
src/
├── index.ts       # CLI entry point
├── types.ts       # TypeScript interfaces for tasks and initiatives
├── collector.ts   # Parses markdown files with gray-matter
├── generator.ts   # Generates dashboard views and reports
└── utils.ts       # Shared utility functions
```

## Usage

### Monorepo Integration

The project management tool is integrated with Turborepo and runs automatically as part of the monorepo's development workflow.

**Run all workspace packages including PM tool:**
```bash
pnpm dev          # Starts all apps/packages including PM tool in watch mode
pnpm build        # Builds all apps/packages including generating PM dashboard
```

**Run only the PM tool:**
```bash
pnpm dev:pm       # Watch markdown files and regenerate dashboard on changes
pnpm build:pm     # Generate dashboard once and exit
```

**Standalone usage (from this package directory):**
```bash
pnpm dev          # Watch mode
pnpm build        # One-time build
```

### How It Works

- **Dev Mode**: When you run `pnpm dev` from the repository root, the PM tool starts watching markdown files in `/project-management/` and automatically regenerates the dashboard whenever tasks or initiatives are added, modified, or removed.

- **Build Mode**: When you run `pnpm build`, the PM tool generates the dashboard once as part of the build pipeline.

- **Output**:
  - Dashboard: `/project-management/_views/dashboard.md` (regenerated on every build)
  - AI Guide: `/project-management/agents.md` (generated once, never overwritten)

### File Watching

In dev mode, the tool watches for changes to:
- `/project-management/tasks/*.md`
- `/project-management/initiatives/**/*.md`

When files are added, modified, or removed, the dashboard automatically regenerates.

## Task Format

Tasks are markdown files with frontmatter:

```markdown
---
id: task-001
title: Implement feature X
status: in-progress
priority: high
assignee: john@example.com
dueDate: 2026-01-31
tags: [frontend, react]
blockedBy: [task-000]
initiative: feature-x
---

## Description

Detailed task description here...
```

## Initiative Format

Initiatives are markdown files that group related tasks:

```markdown
---
id: init-001
title: Feature X Initiative
status: in-progress
priority: high
owner: john@example.com
startDate: 2026-01-01
targetDate: 2026-02-28
tags: [frontend]
---

## Overview

Initiative description and goals...
```

## Status

✅ **Fully Integrated** - The project management tool is fully integrated with Turborepo and runs as part of the monorepo's dev and build workflows.

### Features

- ✅ Markdown file parsing with gray-matter
- ✅ Task and initiative collection
- ✅ Dashboard generation
- ✅ AI agent documentation (auto-generated `agents.md`)
- ✅ File watching with automatic regeneration
- ✅ Turborepo integration
- ✅ Validation and warning system
- ✅ Support for task dependencies and relationships

### AI Agent Documentation

The tool automatically generates a comprehensive `agents.md` guide in the project-management folder on first build. This guide provides:

- Overview of the markdown-first PM system
- File structure explanation
- Complete frontmatter schema with examples
- Step-by-step workflows for creating, updating, and completing tasks
- Blocking relationship patterns
- Tips and best practices for AI agents

**Important**: The `agents.md` file is only generated once. If it already exists, it won't be overwritten, allowing you to customize it for your project.

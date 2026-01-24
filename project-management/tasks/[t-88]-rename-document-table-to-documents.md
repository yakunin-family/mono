---
status: todo
priority: low
description: Rename the document table to documents for consistency with other plural table names
tags: [backend, convex, refactoring]
---

# Rename document table to documents for consistency

## Problem

The Convex schema at `apps/backend/convex/schema.ts` has a table named `document` (singular), while all other tables use plural names:

- `userProfile`
- `aiUsage`
- `spaces`
- `spaceInvites`
- `homeworkItems`
- `aiGeneration`
- `exerciseGenerationSession`
- `exerciseGenerationStep`
- `library`

This inconsistency causes confusion when referencing the table (e.g., `v.id("document")` vs `v.id("documents")`).

## Solution

Rename the `document` table to `documents` and update all references throughout the codebase.

## Implementation Steps

1. Update the table definition in `apps/backend/convex/schema.ts`
2. Update all `v.id("document")` references to `v.id("documents")`
3. Update all `ctx.db.query("document")` calls to `ctx.db.query("documents")`
4. Update all index references that mention the document table

## Notes

- This is a breaking change that requires a migration
- All existing data in the `document` table will need to be migrated to `documents`
- Consider doing this during a low-traffic period

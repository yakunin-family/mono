---
status: done
priority: high
description: Link documents (lessons) to spaces with ordering
tags: [backend, convex]
references: blocked-by:t-15, blocked-by:t-16
---

# Document-Space Integration Backend

## Overview

Modify the document system to work within spaces. Documents (lessons) belong to spaces and have lesson numbers for ordering.

## Files Modified

- `apps/backend/convex/documents.ts`

## Functions Added

- `createLesson` - Create lesson in space with auto-numbering
- `getSpaceLessons` - Get lessons ordered by number
- `getLesson` - Get lesson with space context
- `updateLesson` - Update title and number
- `deleteLesson` - Delete lesson and homework
- `reorderLessons` - Bulk reorder

## Acceptance Criteria

- [x] Lessons created within spaces
- [x] Auto-numbering works
- [x] Lessons ordered correctly
- [x] Reordering updates all numbers
- [x] Deletion cleans up homework

---
status: done
priority: high
description: Teacher UI for assigning homework and reviewing completion
tags: [frontend, teacher, homework]
references: blocked-by:t-21, blocked-by:t-22
---

# Homework Teacher UI

## Overview

Implement the teacher-facing UI for marking exercises as homework and reviewing student completion.

## Files Created

- `packages/editor/src/components/HomeworkBadge.tsx`

## Files Modified

- `packages/editor/src/extensions/ExerciseView.tsx`
- `apps/teacher/src/routes/_protected/spaces.$id.tsx`

## Features

- "Assign as Homework" button on exercises
- Homework badge indicator
- Homework review section in space
- Completion status per exercise

## Acceptance Criteria

- [x] Can assign exercises as homework
- [x] Visual indicator for assigned homework
- [x] Can view completion status
- [x] Can unassign homework

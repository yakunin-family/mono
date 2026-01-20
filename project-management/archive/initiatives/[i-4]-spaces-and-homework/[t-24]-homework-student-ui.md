---
status: done
priority: high
description: Student UI for viewing and completing homework
tags: [frontend, student, homework]
references: blocked-by:t-19, blocked-by:t-21, blocked-by:t-22
---

# Homework Student UI

## Overview

Implement the student-facing UI for viewing homework, completing exercises, and marking homework as done.

## Files Created

- `apps/student/src/components/HomeworkCard.tsx`
- `apps/student/src/components/HomeworkProgress.tsx`

## Files Modified

- `packages/editor/src/extensions/ExerciseView.tsx`
- `apps/student/src/routes/_protected/spaces.$id.tsx`
- `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

## Features

- Homework list in space view
- Homework card with lesson link
- "Mark as Done" button
- Progress visualization
- Homework indicators in lessons

## Acceptance Criteria

- [x] Students see pending homework
- [x] Can navigate to homework exercises
- [x] Can mark homework complete
- [x] Progress shown visually

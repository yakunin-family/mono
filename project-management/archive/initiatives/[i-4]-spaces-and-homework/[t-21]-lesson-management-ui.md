---
status: done
priority: high
description: UI for creating, editing, and managing lessons in spaces
tags: [frontend, ui, lessons]
references: blocked-by:t-18, blocked-by:t-19, blocked-by:t-20
---

# Lesson Management UI

## Overview

Implement the UI for creating, viewing, editing, and managing lessons within spaces for both teachers and students.

## Files Created

### Teacher App
- `apps/teacher/src/routes/_protected/spaces.$id.new-lesson.tsx`
- `apps/teacher/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

### Student App
- `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

## Files Modified

- `apps/teacher/src/routes/_protected/spaces.$id.tsx`
- `packages/editor/src/components/DocumentEditor.tsx`

## Features

- Create new lesson with title
- Lesson list with ordering
- Lesson editor (teacher)
- Lesson viewer (student)
- Drag-and-drop reordering (future)

## Acceptance Criteria

- [x] Teachers can create lessons
- [x] Lessons appear in order
- [x] Teachers can edit lessons
- [x] Students can view lessons

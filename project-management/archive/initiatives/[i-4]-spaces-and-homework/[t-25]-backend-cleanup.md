---
status: done
priority: medium
description: Remove legacy backend code for old sharing system
tags: [backend, cleanup]
references: blocked-by:t-24
---

# Backend Cleanup

## Overview

Remove all legacy backend code related to the old teacher-student relationship model and document sharing.

## Tables Removed

- `teacherStudents` - Old relationship table
- `sharedDocuments` - Old sharing table

## Functions Removed

From `documents.ts`:
- `shareWithStudents`
- `getSharedDocuments`
- `unshareDocument`

From `students.ts`:
- `joinTeacher`
- `getMyTeachers`
- `getMyStudents`
- Legacy invite functions

## Acceptance Criteria

- [x] Legacy tables removed from schema
- [x] Legacy functions removed
- [x] No orphaned references
- [x] No TypeScript errors

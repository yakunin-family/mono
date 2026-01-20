---
status: done
priority: high
description: Backend for marking exercises as homework and tracking completion
tags: [backend, convex, homework]
references: blocked-by:t-15, blocked-by:t-20
---

# Homework System Backend

## Overview

Implement the backend for the homework system. Teachers mark exercises, students complete them, system tracks status.

## Files Created

- `apps/backend/convex/homework.ts`

## Functions Implemented

### Queries
- `getSpaceHomework` - All homework for a space
- `getPendingHomework` - Incomplete homework for student
- `getHomeworkForExercise` - Check if exercise is homework
- `getHomeworkStats` - Completion statistics

### Mutations
- `markAsHomework` - Teacher assigns exercise
- `unmarkHomework` - Teacher removes assignment
- `completeHomework` - Student marks done
- `uncompleteHomework` - Student marks undone

## Acceptance Criteria

- [x] Teachers can mark exercises
- [x] Students can complete homework
- [x] Completion tracked per exercise
- [x] Stats available for progress view

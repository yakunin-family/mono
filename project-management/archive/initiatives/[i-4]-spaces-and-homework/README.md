---
status: done
priority: critical
description: Implement teacher-student spaces with lesson management and homework tracking
tags: [backend, frontend, spaces, homework, completed]
---

# Spaces and Homework Initiative

## Overview

Replace the generic document sharing system with a space-centric architecture. Each space represents a 1:1 teaching relationship between a teacher and student for a specific language.

**Status: Completed** - All tasks finished successfully.

## Problem

Current system has:
- Flat document sharing (teacher shares individual docs with students)
- No organization by student/language
- No lesson progression tracking
- No homework system

## Solution

Introduce "Spaces":
- 1:1 teacher-student relationship
- Language-specific (e.g., "German with Teacher Alex")
- Lesson management within spaces
- Homework assignment and tracking

## Tasks

- [t-1] Schema Updates - Add spaces, spaceInvites, homeworkItems tables
- [t-2] Space CRUD Backend - Queries and mutations for spaces
- [t-3] Invite System Backend - Token-based invite links with language
- [t-4] Teacher Space UI - Space-centric dashboard redesign
- [t-5] Student Space UI - Student dashboard with spaces view
- [t-6] Document-Space Integration - Link lessons to spaces
- [t-7] Lesson Management UI - Create/edit/reorder lessons in spaces
- [t-8] Homework Backend - Mark exercises, track completion
- [t-9] Homework Teacher UI - Assign exercises, review progress
- [t-10] Homework Student UI - View and complete homework
- [t-11] Backend Cleanup - Remove legacy tables and functions
- [t-12] Frontend Cleanup - Remove legacy components and routes

## Key Files

### Backend
- `apps/backend/convex/schema.ts` - New tables
- `apps/backend/convex/spaces.ts` - Space CRUD
- `apps/backend/convex/spaceInvites.ts` - Invite system
- `apps/backend/convex/homework.ts` - Homework tracking
- `apps/backend/convex/documents.ts` - Lesson integration

### Teacher App
- `apps/teacher/src/routes/_protected/index.tsx` - Space-centric dashboard
- `apps/teacher/src/routes/_protected/spaces.$id.tsx` - Space detail
- `apps/teacher/src/components/CreateInviteDialog.tsx`
- `apps/teacher/src/components/SpaceCard.tsx`

### Student App
- `apps/student/src/routes/_protected/index.tsx` - Spaces view
- `apps/student/src/routes/_protected/spaces.$id.tsx` - Space detail
- `apps/student/src/routes/join.$token.tsx` - New invite flow
- `apps/student/src/components/HomeworkCard.tsx`

## Success Criteria

All completed:
- [x] Teachers can create invite links with language
- [x] Students can accept invites and join spaces
- [x] Teachers see space-organized dashboard
- [x] Lessons exist within spaces
- [x] Teachers can assign exercises as homework
- [x] Students can view and complete homework
- [x] Homework completion tracked
- [x] Legacy code removed

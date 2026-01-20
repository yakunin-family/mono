---
status: done
priority: high
description: Implement queries and mutations for space CRUD operations
tags: [backend, convex]
references: blocked-by:t-15
---

# Space CRUD Backend

## Overview

Implement backend queries and mutations for creating, reading, updating, and deleting spaces.

## Files Created

- `apps/backend/convex/spaces.ts`

## Functions Implemented

### Queries
- `getMySpacesAsTeacher` - Get all spaces where user is teacher
- `getMySpacesAsStudent` - Get all spaces where user is student
- `getSpace` - Get single space with enriched data

### Mutations
- `createSpace` - Create space (usually via invite)
- `updateSpace` - Update space language
- `deleteSpace` - Delete space and related data

## Acceptance Criteria

- [x] Teachers can view their spaces
- [x] Students can view their spaces
- [x] Spaces include user info (names, avatars)
- [x] Authorization checks in place

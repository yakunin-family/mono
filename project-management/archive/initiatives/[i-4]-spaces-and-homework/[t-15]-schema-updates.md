---
status: done
priority: critical
description: Add spaces, spaceInvites, and homeworkItems tables to schema
tags: [backend, schema]
---

# Schema Updates

## Overview

Add new tables and modify existing tables to support the Spaces and Homework feature. This is the foundation task that all other tasks depend on.

## Files Modified

- `apps/backend/convex/schema.ts`

## New Tables

### spaces

- `teacherId: string` - WorkOS user ID
- `studentId: string` - WorkOS user ID
- `language: string` - Free text language name
- `createdAt: number` - Timestamp

### spaceInvites

- `teacherId: string` - Teacher who created invite
- `language: string` - Language for the space
- `token: string` - Unique invite token
- `createdAt: number` - When created
- `expiresAt?: number` - Optional expiration
- `usedAt?: number` - When used
- `usedBy?: string` - Student who used it
- `resultingSpaceId?: Id<"spaces">` - Created space

### homeworkItems

- `spaceId: Id<"spaces">` - Which space
- `documentId: Id<"document">` - Which lesson
- `exerciseInstanceId: string` - Exercise node ID
- `markedAt: number` - When marked
- `completedAt?: number` - When completed

### document table updates

- Added `spaceId?: Id<"spaces">`
- Added `lessonNumber?: number`
- Made `owner` optional for backward compatibility

## Acceptance Criteria

- [x] New tables created
- [x] Indexes defined for efficient queries
- [x] Document table updated
- [x] No migration errors

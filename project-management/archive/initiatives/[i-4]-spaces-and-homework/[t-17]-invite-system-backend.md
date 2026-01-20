---
status: done
priority: high
description: Implement token-based invite system with language specification
tags: [backend, convex, invites]
references: blocked-by:t-15
---

# Invite System Backend

## Overview

Implement the invite system that allows teachers to create invite links with a pre-specified language. When a student accepts, a space is automatically created.

## Files Created

- `apps/backend/convex/spaceInvites.ts`

## Functions Implemented

### Queries
- `getInviteByToken` - Get invite details for accept page
- `getMyInvites` - Get teacher's pending invites

### Mutations
- `createInvite` - Generate invite with language
- `acceptInvite` - Student accepts, space created
- `revokeInvite` - Cancel pending invite

## Acceptance Criteria

- [x] Teachers can create invites with language
- [x] Invites generate unique tokens
- [x] Students can accept via token
- [x] Space auto-created on accept
- [x] Duplicate prevention (same teacher-student pair)

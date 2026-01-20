---
status: done
priority: high
description: Redesign teacher dashboard to be space-centric
tags: [frontend, teacher, ui]
references: blocked-by:t-16, blocked-by:t-17
---

# Teacher Space Management UI

## Overview

Redesign the teacher app dashboard to be space-centric. Teachers see a list of their students (spaces) and can create invites.

## Files Created

- `apps/teacher/src/components/SpaceCard.tsx`
- `apps/teacher/src/components/CreateInviteDialog.tsx`
- `apps/teacher/src/components/InvitesList.tsx`
- `apps/teacher/src/routes/_protected/spaces.$id.tsx`

## Files Modified

- `apps/teacher/src/routes/_protected/index.tsx`

## Features

- Space list with student info and language
- Create invite dialog with language selection
- Pending invites list with revoke option
- Space detail page for managing lessons

## Acceptance Criteria

- [x] Dashboard shows spaces not documents
- [x] Can create invites with language
- [x] Can view and revoke pending invites
- [x] Space detail page accessible

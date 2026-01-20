---
status: done
priority: high
description: Redesign student dashboard to be space-centric
tags: [frontend, student, ui]
references: blocked-by:t-16, blocked-by:t-17
---

# Student Space View UI

## Overview

Redesign the student app dashboard to be space-centric. Students see their learning spaces with quick access to homework and lessons.

## Files Created

- `apps/student/src/components/SpaceCard.tsx`
- `apps/student/src/routes/_protected/spaces.$id.tsx`

## Files Modified

- `apps/student/src/routes/_protected/index.tsx`
- `apps/student/src/routes/join.$token.tsx`

## Features

- Space list with teacher, language, homework count
- Space detail with lessons and homework
- Updated join flow for new invite system
- Homework indicators on space cards

## Acceptance Criteria

- [x] Dashboard shows spaces
- [x] Join flow works with new invites
- [x] Space detail shows lessons
- [x] Homework count visible on cards

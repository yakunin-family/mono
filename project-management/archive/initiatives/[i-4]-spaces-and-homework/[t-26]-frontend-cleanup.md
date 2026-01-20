---
status: done
priority: medium
description: Remove legacy frontend code for old sharing UI
tags: [frontend, cleanup]
references: blocked-by:t-25
---

# Frontend Cleanup

## Overview

Remove all legacy frontend code related to the old teacher-student relationship model and document sharing UI.

## Teacher App Cleanup

### Deleted
- `DocumentShareDialog.tsx`
- Old invite components
- Old students list

### Modified
- Routes to remove old pages
- Navigation updates

## Student App Cleanup

### Deleted
- "My Teachers" section
- "Shared Documents" section
- Old join flow components

### Modified
- Routes cleanup
- Navigation updates

## Acceptance Criteria

- [x] No legacy components remain
- [x] No unused imports
- [x] Routes cleaned up
- [x] No TypeScript errors
- [x] No broken links

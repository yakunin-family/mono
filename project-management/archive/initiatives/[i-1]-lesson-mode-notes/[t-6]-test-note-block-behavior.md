---
status: done
priority: medium
description: Comprehensive manual testing across modes and scenarios
tags: [testing, qa]
references: blocked-by:t-5
---

# Test Note Block Behavior

## Description

Perform comprehensive manual testing to verify all note block functionality works correctly across different modes and scenarios.

## Test Scenarios

### 1. Note Block Creation (Teacher)
- Open document in teacher app
- Switch to lesson mode
- Verify note button appears in toolbar
- Click note button and verify insertion

### 2. Note Block Editing
- Teacher can edit notes
- Student can edit notes
- Both see real-time sync

### 3. Lesson Mode Read-Only Behavior
- Main content is read-only
- Notes are editable
- Blanks/exercises are editable

### 4. Note Block Nesting Prevention
- `defining: true` prevents nesting

### 5. Collaboration Testing
- Real-time sync works
- No conflicts or data loss

### 6. Visual Design Verification
- Yellow background, border, styling

### 7. Mode Switching
- Notes persist across mode switches

## Acceptance Criteria

- [ ] All test scenarios pass
- [ ] No TypeScript errors in console
- [ ] No React errors in console
- [ ] Real-time collaboration works smoothly
- [ ] UX feels responsive and intuitive

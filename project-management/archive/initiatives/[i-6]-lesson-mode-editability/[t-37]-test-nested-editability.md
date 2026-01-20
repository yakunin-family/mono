---
status: done
priority: high
description: Comprehensive testing across all modes
tags: [testing, qa]
references: blocked-by:t-35, blocked-by:t-36
---

# Test Nested Editability

## Description

Comprehensive testing to verify all content types work correctly across all editor modes.

## Test Scenarios

### Teacher-Editor Mode
- [ ] All content is editable
- [ ] No visual read-only indicators
- [ ] Full formatting capabilities

### Teacher-Lesson Mode
- [ ] Main content is read-only
- [ ] Cannot type or edit main content
- [ ] Can edit note blocks
- [ ] Can edit blank inputs
- [ ] Can edit exercise content

### Student Mode
- [ ] Same as teacher-lesson
- [ ] Main content read-only
- [ ] Interactive elements editable

### Nested Editability
- [ ] Blanks inside read-only paragraphs work
- [ ] Content inside note blocks editable
- [ ] Nested lists work correctly

### Collaboration
- [ ] Yjs syncs correctly across modes
- [ ] Real-time collaboration works
- [ ] No conflicts or data loss

## Acceptance Criteria

- [ ] All scenarios pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mode switching is instant

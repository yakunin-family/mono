---
status: todo
priority: medium
description: Create tool definitions and handlers for space management and homework operations (6 tools)
tags: [backend, convex, tools]
---

# Define Space and Homework Operation Tools

Create tool definitions and handlers for space management and homework operations (6 tools total).

## Space Management Tools (3 tools)

### 1. list_spaces

* **Description**: See all teacher's spaces
* **Parameters**: None (uses auth context)
* **Handler**: `internal.tools.spaces.listSpaces`

### 2. get_space_details

* **Description**: Get info about specific space (student name, language, lessons)
* **Parameters**: `spaceId`
* **Handler**: `internal.tools.spaces.getDetails`

### 3. create_space_invite

* **Description**: Generate invite link for new student to join a space
* **Parameters**: `spaceId`
* **Handler**: `internal.tools.spaces.createInvite`

## Homework Operation Tools (3 tools)

### 4. assign_homework

* **Description**: Mark specific exercises as homework for student
* **Parameters**: `spaceId`, `exerciseNodeIds` (array), `dueDate` (optional)
* **Handler**: `internal.tools.homework.assign`

### 5. list_homework

* **Description**: See student's homework status in a space
* **Parameters**: `spaceId`, `status` (optional: all, pending, completed)
* **Handler**: `internal.tools.homework.list`

### 6. get_student_progress

* **Description**: View completion status and performance for a student
* **Parameters**: `spaceId`, `studentId`
* **Handler**: `internal.tools.homework.getProgress`

## File Structure

* `convex/tools/spaces.ts` - Space management handlers
* `convex/tools/homework.ts` - Homework operation handlers

## Acceptance Criteria

- [ ] All 6 tool definitions added to registry
- [ ] Space tools properly fetch and filter by teacher ownership
- [ ] Homework tools validate space access before operations
- [ ] `create_space_invite` generates secure invite tokens
- [ ] Progress tracking includes completion rates and scores
- [ ] Error handling for invalid space IDs or permissions

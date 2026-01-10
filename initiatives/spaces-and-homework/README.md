# Spaces and Homework Initiative

## Overview

This initiative introduces a fundamental architectural change to how teachers and students interact on the platform. Instead of documents being the primary entry point, we introduce **Spaces** - a container representing the 1:1 teaching relationship between a teacher and student for a specific language.

**Current Model (Being Replaced):**
```
Teacher
├── Documents (floating, no context)
├── Students (flat list via teacherStudents)
└── Share document → student (ad-hoc via sharedDocuments)
```

**New Model:**
```
Teacher
├── Space: "Anna · German"
│   ├── Lesson #1 - Introduction
│   ├── Lesson #2 - Passive Voice
│   └── Homework items
├── Space: "Boris · English"
│   └── Lessons...
└── Library (global, reusable content)

Student
├── Space: "German with Mr. Smith"
│   ├── Lessons
│   └── My Homework
└── Space: "French with Ms. Jones"
    └── ...
```

## Problem Statement

1. **Document-centric view is wrong for 1:1 lessons**: Teachers think in terms of students, not documents. "What am I doing with Anna today?" not "Which documents do I have?"

2. **No language context**: When a teacher invites a student, there's no indication of what language they're learning. This context is essential for organizing content.

3. **No homework workflow**: Teachers cannot assign specific content as homework. Students have no clear view of what they need to complete before the next lesson.

4. **Flat document list is unorganized**: Students see all shared documents in a flat list with no structure or ordering.

## Solution

### Core Concepts

**Space** = `{ teacher, student, language }`
- Represents a 1:1 teaching relationship for a specific language
- Contains all lessons (documents) for that relationship
- Contains homework assignments for that student
- Created when student accepts an invite

**Lesson** = Document within a Space
- Has a `lessonNumber` for ordering (Lesson #1, #2, #3...)
- Has a `title` describing the topic
- Displayed as "Lesson #31 - Passive Voice"

**Homework** = Exercise blocks marked for student completion
- Teacher marks Exercise nodes as homework
- Student sees aggregated homework list in their space
- Student marks exercises as complete
- Teacher can review completed homework

### Key Design Decisions

1. **Language is free text**: Teachers can write "German", "Business English", "German (Beginners)" - whatever makes sense for their context.

2. **1:1 only for now**: Spaces have exactly one student. Group lessons may be added later as a separate concept.

3. **Spaces are deletable**: No archive functionality initially. Deleting a space removes all associated lessons and homework.

4. **Exercises only for homework (v1)**: Initially only Exercise nodes can be marked as homework. Schema supports any block for future extension.

5. **No due dates**: Platform is for 1:1 private lessons where homework is implicitly "before next lesson."

6. **Invite creates space immediately**: When student accepts invite, the space is created with the language pre-configured.

## Tasks

Tasks are organized for parallel execution where possible. Dependencies are clearly marked.

### Phase 1: Foundation
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 0](./task-0-schema-updates.md) | Schema updates for spaces, invites, homework | None |

### Phase 2: Space Management (Parallelizable)
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 1](./task-1-space-crud-backend.md) | Space CRUD operations backend | Task 0 |
| [Task 2](./task-2-invite-system-backend.md) | Invite system with language | Task 0 |

### Phase 3: Space UI (Parallelizable after Task 1, 2)
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 3](./task-3-teacher-space-ui.md) | Teacher app space management UI | Tasks 1, 2 |
| [Task 4](./task-4-student-space-ui.md) | Student app space view UI | Tasks 1, 2 |

### Phase 4: Document Integration
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 5](./task-5-document-space-integration.md) | Document-space integration backend | Task 1 |
| [Task 6](./task-6-lesson-management-ui.md) | Lesson management UI (both apps) | Tasks 3, 4, 5 |

### Phase 5: Homework System (Parallelizable)
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 7](./task-7-homework-backend.md) | Homework system backend | Task 5 |
| [Task 8](./task-8-homework-teacher-ui.md) | Teacher homework marking UI | Task 7 |
| [Task 9](./task-9-homework-student-ui.md) | Student homework view and completion | Task 7 |

### Phase 6: Cleanup (Sequential)
| Task | Description | Dependencies |
|------|-------------|--------------|
| [Task 10](./task-10-backend-cleanup.md) | Remove legacy backend code and tables | Tasks 0-9 |
| [Task 11](./task-11-frontend-cleanup.md) | Remove legacy frontend code | Task 10 |

### Execution Graph

```
Task 0 (Schema)
    │
    ├─────────────────┐
    ▼                 ▼
Task 1 (CRUD)    Task 2 (Invites)
    │                 │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
Task 3 (Teacher)  Task 4 (Student)
    │                 │
    └────────┬────────┘
             │
             ▼
      Task 5 (Doc Integration)
             │
             ▼
      Task 6 (Lesson UI)
             │
             ▼
      Task 7 (Homework Backend)
             │
    ┌────────┴────────┐
    ▼                 ▼
Task 8 (HW Teacher) Task 9 (HW Student)
    │                 │
    └────────┬────────┘
             │
             ▼
      Task 10 (Backend Cleanup)
             │
             ▼
      Task 11 (Frontend Cleanup)
```

## Data Model

### New Tables

```typescript
// spaces - Core entity replacing teacherStudents for active relationships
spaces: defineTable({
  teacherId: v.string(),      // Better Auth user ID
  studentId: v.string(),      // Better Auth user ID
  language: v.string(),       // Free text: "German", "Business English", etc.
  createdAt: v.number(),
})
  .index("by_teacher", ["teacherId"])
  .index("by_student", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"])

// spaceInvites - Invite tokens that create spaces
spaceInvites: defineTable({
  teacherId: v.string(),
  language: v.string(),
  token: v.string(),          // Unique invite token
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  usedAt: v.optional(v.number()),
  usedBy: v.optional(v.string()),           // studentId when used
  resultingSpaceId: v.optional(v.id("spaces")), // Created space
})
  .index("by_token", ["token"])
  .index("by_teacher", ["teacherId"])

// homeworkItems - Exercises marked as homework
homeworkItems: defineTable({
  spaceId: v.id("spaces"),
  documentId: v.id("document"),
  exerciseInstanceId: v.string(),  // Exercise node's instanceId
  markedAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_space", ["spaceId"])
  .index("by_space_incomplete", ["spaceId", "completedAt"])
  .index("by_document", ["documentId"])
```

### Modified Tables

```typescript
// document - Add spaceId and lessonNumber
document: defineTable({
  // NEW FIELDS
  spaceId: v.optional(v.id("spaces")),  // Optional during migration
  lessonNumber: v.optional(v.number()), // 1, 2, 3... for ordering

  // EXISTING FIELDS (owner becomes optional/deprecated)
  owner: v.optional(v.string()),
  title: v.string(),
  content: v.optional(v.bytes()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["owner"])
  .index("by_space", ["spaceId"])  // NEW
  .index("by_space_lesson", ["spaceId", "lessonNumber"])  // NEW
```

### Tables to Delete (Task 10)

- `teacherStudents` - Replaced by `spaces`, delete entirely
- `sharedDocuments` - Replaced by space membership, delete entirely

## API Design

### Space Management

```typescript
// Queries
getMySpaces()           // Teacher: all spaces they own
getMySpacesAsStudent()  // Student: all spaces they're in
getSpace(spaceId)       // Get single space with details

// Mutations
createSpace(studentId, language)  // Direct creation (teacher)
deleteSpace(spaceId)              // Delete space and all content
```

### Invite System

```typescript
// Mutations
createSpaceInvite(language)       // Generate invite link
revokeSpaceInvite(inviteId)       // Cancel unused invite
acceptSpaceInvite(token)          // Student accepts, creates space

// Queries
getMyInvites()                    // Teacher: list pending invites
getInviteByToken(token)           // Validate invite for accept flow
```

### Lessons (Documents in Space)

```typescript
// Queries
getSpaceLessons(spaceId)          // All lessons in space, ordered
getLesson(documentId)             // Single lesson with space context

// Mutations
createLesson(spaceId, title)      // Create new lesson (auto lessonNumber)
updateLesson(documentId, {title, lessonNumber})
deleteLesson(documentId)
reorderLessons(spaceId, lessonIds[])  // Bulk reorder
```

### Homework

```typescript
// Queries
getSpaceHomework(spaceId)                    // All homework in space
getIncompleteHomework(spaceId)               // Pending homework only
getHomeworkForDocument(documentId)           // Homework in specific doc

// Mutations
markAsHomework(documentId, exerciseInstanceId)
removeFromHomework(homeworkItemId)
completeHomework(homeworkItemId)             // Student marks done
uncompleteHomework(homeworkItemId)           // Undo completion
```

## UI/UX Design

### Teacher App

**Dashboard (`/spaces` or `/`)**
- List of spaces showing: Student name, Language, Last lesson date
- "Create Invite" button → modal with language input
- Click space → opens space detail

**Space Detail (`/spaces/:id`)**
- Header: Student name, Language
- Lessons list: "Lesson #1 - Topic", "Lesson #2 - Topic"
- "New Lesson" button
- Homework overview: X items pending review
- Delete space (with confirmation)

**Lesson Editor (`/spaces/:id/lesson/:lessonId`)**
- Same editor as before
- Exercise nodes get "Assign as Homework" button
- Breadcrumb: Space name > Lesson title

**Invites Section**
- List of pending invites with copy link button
- Can revoke invites

### Student App

**Dashboard (`/spaces` or `/`)**
- List of spaces showing: Teacher name, Language, Pending homework count
- Click space → opens space detail

**Space Detail (`/spaces/:id`)**
- Header: Teacher name, Language
- **Homework Section** (prominent): List of incomplete homework items
- Lessons list: All lessons, ordered by number
- Click homework → opens lesson scrolled to that exercise

**Lesson View (`/spaces/:id/lesson/:lessonId`)**
- Read/interact with lesson content
- Homework items highlighted
- "Mark Complete" button on homework exercises

**Join Flow (`/join/:token`)**
- Shows: Teacher name, Language
- "Join" button → creates space, redirects to it

## Migration Strategy

**No data migration** - existing data will be deleted as part of cleanup.

1. **Add new tables**: `spaces`, `spaceInvites`, `homeworkItems`
2. **Add new fields to document**: `spaceId`, `lessonNumber` (optional during build phase)
3. **Build new features**: All new code uses spaces (Tasks 0-9)
4. **Cleanup**: Remove old tables and code entirely (Tasks 10-11)
5. **Finalize document schema**: Make `spaceId` and `lessonNumber` required

**Data loss is acceptable** - no migration path for:
- `teacherStudents` records (old enrollments)
- `sharedDocuments` records (old sharing)
- Documents without `spaceId` (orphaned documents)

## Success Criteria

### Feature Completion
- [ ] Teacher can create invite with language specified
- [ ] Student can accept invite, space is created
- [ ] Teacher sees list of spaces (students) on dashboard
- [ ] Student sees list of spaces (teachers) on dashboard
- [ ] Teacher can create lessons within a space
- [ ] Lessons are numbered and ordered
- [ ] Teacher can mark exercises as homework
- [ ] Student sees homework list in space
- [ ] Student can mark homework as complete
- [ ] Teacher can see homework completion status

### Cleanup Verification
- [ ] `teacherStudents` table removed from schema
- [ ] `sharedDocuments` table removed from schema
- [ ] `document.owner` field removed
- [ ] No references to old APIs in frontend
- [ ] Old routes removed or redirecting
- [ ] `grep -r "teacherStudents\|sharedDocuments"` returns no results

## Future Enhancements (Out of Scope)

- Archive spaces instead of delete
- Group lessons (multiple students in space)
- Due dates for homework
- AI-assisted homework review
- Homework marking for non-exercise content
- Progress tracking / analytics
- Lesson templates that auto-create in new spaces

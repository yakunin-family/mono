# Data Models

**Last Updated**: 2025-01-24
**Status**: Current
**Owner**: Engineering

## Overview

This document describes the data models for Lexly, including Convex schemas, ProseMirror/Tiptap node structures, and Y.js persistence patterns.

## Core Entities (Convex Schema)

### Users

```typescript
users {
  id: uuid
  role: "teacher" | "student"
  name: string
  email: string
  subscription_tier?: string  // "free" | "basic" | "pro" | "school"
  org_id?: uuid               // For school accounts
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes**:
- `by_email`: For login lookups
- `by_org_id`: For school account queries

### Lessons

```typescript
lessons {
  id: uuid
  teacher_id: uuid (fk users)
  student_id: uuid (fk users)
  title: string
  course_id?: uuid (fk courses)
  preferred_region?: string   // "eu" | "us" | "asia" (for multi-region)
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes**:
- `by_teacher_id`: Teacher's lesson list
- `by_student_id`: Student's lesson list
- `by_course_id`: Lessons in a course

**Notes**:
- Lesson content stored in Y.js documents (not Convex)
- This table tracks metadata and permissions only

### Blocks (Legacy - may be deprecated)

```typescript
blocks {
  id: uuid
  lesson_id: uuid (fk lessons)
  type: "text" | "translation" | "fill_in" | "multiple_choice" | "table" | "image" | "vocabulary"
  content: jsonb              // ProseMirror/Tiptap node JSON
  order: int
  is_homework: boolean
  created_at: timestamp
}
```

**Status**: May be deprecated in favor of Y.js-only storage. Kept for potential:
- Indexing/search across lesson content
- Static snapshots for backup
- Analytics on exercise types

### Exercises (Exercise Bank)

```typescript
exercises {
  id: uuid
  teacher_id: uuid (fk users)
  title: string
  description?: string
  category?: string           // "grammar" | "vocabulary" | "reading" | "listening"
  difficulty_level?: string   // "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  language_pair?: string      // "en-de" | "es-en", etc.
  tags?: string[]             // ["past-tense", "modal-verbs"]
  block_template: jsonb       // ProseMirror/Tiptap node
  version: int                // Semantic versioning
  usage_count: int            // How many times inserted
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes**:
- `by_teacher_id`: Teacher's exercise bank
- `by_category`: Filter by category
- `by_difficulty_level`: Filter by level
- `by_tags`: Full-text search on tags

**Versioning strategy**:
- Increment version on edit (copy-on-write)
- Old versions kept for lessons that reference them
- Teacher can "upgrade" lesson exercises to latest version

## Exercise Node Structure (ProseMirror/Tiptap)

Custom Tiptap nodes embed exercise metadata and content:

### Base Exercise Node

```typescript
{
  type: 'exerciseCard',
  attrs: {
    instanceId: string,      // Unique per insertion (e.g., "exi_8v6xyz")
    exerciseId: string,      // References exercises table (e.g., "ex_123")
    exerciseVersion: number, // Version at time of insertion
    snapshot: ExerciseSnapshot  // Denormalized content
  },
  content: []  // May contain student annotations
}
```

### Exercise Snapshot Types

#### Cloze (Fill-in-the-Blank)

```typescript
{
  kind: 'cloze',
  promptHtml: '<p>Ich ___ ein Buch.</p>',
  blanks: [
    {
      id: 'b1',
      hint: 'haben/sein',
      correctAnswers: ['habe']
    }
  ]
}
```

#### Translation

```typescript
{
  kind: 'translation',
  sourceText: 'I have a book.',
  targetLanguage: 'de',
  correctAnswers: [
    'Ich habe ein Buch.',
    'Ich hab ein Buch.'  // Accept contractions
  ],
  hints?: ['Verb: haben', 'Article: ein']
}
```

#### Multiple Choice

```typescript
{
  kind: 'multiple_choice',
  question: 'What is the correct form of "haben" for "ich"?',
  options: [
    { id: 'opt1', text: 'habe', correct: true },
    { id: 'opt2', text: 'hast', correct: false },
    { id: 'opt3', text: 'hat', correct: false },
    { id: 'opt4', text: 'haben', correct: false }
  ],
  allowMultiple: false  // Single or multi-select
}
```

#### Vocabulary Table

```typescript
{
  kind: 'vocabulary',
  rows: [
    {
      id: 'row1',
      word: 'das Buch',
      translation: 'the book',
      exampleSentence?: 'Ich lese ein Buch.'
    },
    // ...
  ],
  columns: ['word', 'translation', 'example']
}
```

### Rationale for Snapshot Field

**Why denormalize exercise content?**

1. **Immutability**: Lessons preserve exercise content even if template changes
2. **Teacher control**: Can update exercise bank without breaking old lessons
3. **Version tracking**: Enables "upgrade to latest" feature with diff preview
4. **Performance**: Reduces DB queries during rendering (no joins needed)
5. **Offline support**: Y.js document contains all data needed to render

**Trade-off**: Duplication of data, but acceptable because:
- Exercise content is small (<1KB typically)
- Immutability is critical for educational content
- Simplifies Y.js document structure

## Homework & Grading Data Model

### Assignments

Teacher-created homework assignments:

```typescript
assignments {
  id: uuid
  lesson_id: uuid (fk lessons)
  student_id: uuid (fk users)
  teacher_id: uuid (fk users)
  title: string
  description?: string
  due_at: timestamp
  allow_multiple_submissions: boolean
  status: "assigned" | "submitted" | "graded"
  created_at: timestamp
  updated_at: timestamp
}
```

**Indexes**:
- `by_student_id_and_status`: Student's pending homework
- `by_lesson_id`: Homework for a lesson
- `by_due_at`: Upcoming deadlines

### Assignment Items

Individual exercises within homework:

```typescript
assignment_items {
  id: uuid
  assignment_id: uuid (fk assignments)
  lesson_id: uuid (fk lessons)
  exercise_instance_id: string  // Maps to node.attrs.instanceId in Y.js doc
  exercise_id: uuid (fk exercises)
  exercise_version: int
  schema_version: int           // For future schema migrations
  required: boolean
  grading_mode: "auto" | "manual" | "mixed"
  snapshot: jsonb               // Exercise content at assignment time
  order: int
  created_at: timestamp
}
```

**Indexes**:
- `by_assignment_id`: Items in an assignment
- `by_exercise_instance_id`: Link between assignment and Y.js doc

**Linking strategy**:
- Teacher marks blocks in lesson as "homework"
- Backend creates `assignment` and `assignment_items` records
- `exercise_instance_id` links to `node.attrs.instanceId` in Y.js document
- Student's answers stored in separate Y.js answers document

### Submissions

Student's completed work:

```typescript
submissions {
  id: uuid
  assignment_id: uuid (fk assignments)
  student_id: uuid (fk users)
  submitted_at: timestamp
  answers_snapshot: jsonb       // Captured from Y.js answers doc
  grader_version: string        // e.g., "v1.2.3" for audit trail
  score: float | null           // 0.0 - 1.0 (percentage)
  feedback: string | null       // Teacher comments
  created_at: timestamp
}
```

**Indexes**:
- `by_assignment_id`: Submissions for an assignment
- `by_student_id`: Student's submission history

**Snapshot timing**:
- Captured when student clicks "Submit" button
- Preserves answers even if Y.js document is edited later
- Enables grade history and re-grading

### Grades

Grade history for audit and analytics:

```typescript
grades {
  id: uuid
  submission_id: uuid (fk submissions)
  assignment_item_id: uuid (fk assignment_items)
  exercise_instance_id: string  // Redundant but useful for queries
  score: float                  // 0.0 - 1.0
  feedback: string | null       // Item-specific comments
  graded_by: uuid (fk users)    // Teacher or "auto"
  graded_at: timestamp
  grader_version: string        // Auto-grader version
}
```

**Indexes**:
- `by_submission_id`: Grades for a submission
- `by_assignment_item_id`: Grade history for an exercise

**Audit trail**:
- Immutable records (no updates, only inserts)
- Enables re-grading with comparison
- Tracks auto-grader version for debugging

## Key Design Decisions

### 1. instanceId Pattern

**Why unique IDs for each exercise insertion?**

```typescript
// Same exercise template inserted twice:
{ type: 'exerciseCard', attrs: { instanceId: 'exi_abc', exerciseId: 'ex_123' } }
{ type: 'exerciseCard', attrs: { instanceId: 'exi_def', exerciseId: 'ex_123' } }
```

**Benefits**:
- Teacher can insert same exercise multiple times in lesson
- Each instance can be graded independently
- Homework can reference specific instance, not just exercise type
- Answers stored per-instance in Y.js answers document

### 2. Versioning Strategy

**Exercise versions**:
- Version incremented on edit (copy-on-write)
- Lesson stores version at insertion time
- Old versions preserved in case lessons reference them

**Grader versions**:
- Auto-grading logic versioned separately
- Enables A/B testing of grading algorithms
- Audit trail shows which version produced each grade

### 3. Snapshots vs References

**When to denormalize (snapshot)**:
- Exercise content in lesson nodes (immutability needed)
- Exercise content in assignment items (preserve at assignment time)
- Answers in submissions (preserve at submission time)

**When to reference (normalize)**:
- User data (name, email changes should propagate)
- Subscription tier (affects permissions immediately)
- Lesson metadata (title changes should be visible)

## Collaboration Persistence (Y.js)

Y.js document updates stored separately from structured data:

### Y.js Updates (Append-Only Log)

```typescript
yjs_updates {
  id: uuid
  document_name: string         // e.g., "lesson:123:content"
  update: binary                // Y.js binary update blob
  created_at: timestamp
  size_bytes: int               // For monitoring
}
```

**Indexes**:
- `by_document_name_and_created_at`: Fetch updates since last snapshot

**Retention policy**:
- Keep all updates for 90 days
- After snapshot, can delete older updates
- Compress old snapshots to S3 for long-term archive

### Y.js Snapshots

Periodic snapshots for fast loading:

```typescript
yjs_snapshots {
  id: uuid
  document_name: string
  snapshot: binary              // Full Y.js document state
  update_count: int             // Number of updates since last snapshot
  created_at: timestamp
  size_bytes: int
}
```

**Indexes**:
- `by_document_name`: Fetch latest snapshot

**Snapshot strategy**:
- Create snapshot every 100 updates or 1 hour (whichever first)
- Keep last 3 snapshots for redundancy
- Delete older snapshots after 90 days

### Persistence Flow

**On document update** (Hocuspocus `onStoreDocument` hook):
1. Serialize Y.js update to binary
2. POST to Convex `/api/yjs/store` endpoint
3. Convex inserts into `yjs_updates` table
4. Check if snapshot threshold reached (100 updates or 1 hour)
5. If yes, create snapshot in `yjs_snapshots` table

**On document load** (Hocuspocus `fetch` hook):
1. GET from Convex `/api/yjs/fetch` endpoint with document name
2. Convex queries latest snapshot for document
3. Convex queries all updates since snapshot
4. Return snapshot + updates to Hocuspocus
5. Hocuspocus applies updates to reconstruct current state
6. Y.js provider syncs with clients

### Migration Path: PostgreSQL

**Why might we move to PostgreSQL?**
- Convex storage limits (10GB on free tier)
- Cheaper storage for large update logs
- Better support for binary data (bytea columns)
- Existing PostgreSQL expertise on team

**Migration strategy**:
- Y.js updates fit well in Postgres (JSONB or bytea)
- Keep Convex for structured data (users, lessons, etc.)
- Hocuspocus supports multiple persistence backends (change config only)
- Can migrate incrementally (old docs stay in Convex, new docs go to Postgres)

---

**Related Documentation**:
- [Technical Architecture](./02-technical-architecture.md) - System overview
- [Implementation Guide](./05-implementation-guide.md) - How to work with these models
- [Deployment Guide](./04-deployment-guide.md) - Database hosting options

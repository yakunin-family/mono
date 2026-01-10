# Task 0: Schema Updates

## Overview

Add new tables and modify existing tables to support the Spaces and Homework feature. This is the foundation task that all other tasks depend on.

## Dependencies

None - this is the first task.

## Files to Modify

- `apps/backend/convex/schema.ts`

## Implementation Details

### 1. Add New Tables

Add the following table definitions to `schema.ts`:

#### spaces Table

```typescript
spaces: defineTable({
  teacherId: v.string(),      // Better Auth user ID of the teacher
  studentId: v.string(),      // Better Auth user ID of the student
  language: v.string(),       // Free text language name
  createdAt: v.number(),      // Timestamp
})
  .index("by_teacher", ["teacherId"])
  .index("by_student", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"]),
```

**Notes:**
- `teacherId` and `studentId` are Better Auth user IDs (strings), not Convex document IDs
- `language` is free text to allow flexibility ("German", "Business English", etc.)
- Indexes support querying by teacher (for teacher dashboard) and by student (for student dashboard)
- The compound index allows checking if a space already exists for a teacher-student pair

#### spaceInvites Table

```typescript
spaceInvites: defineTable({
  teacherId: v.string(),                          // Teacher who created invite
  language: v.string(),                           // Language for the space
  token: v.string(),                              // Unique invite token (UUID or nanoid)
  createdAt: v.number(),                          // When invite was created
  expiresAt: v.optional(v.number()),              // Optional expiration timestamp
  usedAt: v.optional(v.number()),                 // When invite was used
  usedBy: v.optional(v.string()),                 // Student who used it
  resultingSpaceId: v.optional(v.id("spaces")),   // Space that was created
})
  .index("by_token", ["token"])
  .index("by_teacher", ["teacherId"]),
```

**Notes:**
- `token` should be unique and URL-safe (recommend using nanoid)
- `expiresAt` is optional - invites can be permanent or time-limited
- When used, populate `usedAt`, `usedBy`, and `resultingSpaceId`
- The `by_token` index is used for fast lookup when accepting invites

#### homeworkItems Table

```typescript
homeworkItems: defineTable({
  spaceId: v.id("spaces"),              // Which space this belongs to
  documentId: v.id("document"),         // Which document/lesson contains the exercise
  exerciseInstanceId: v.string(),       // The instanceId of the Exercise node
  markedAt: v.number(),                 // When teacher marked it as homework
  completedAt: v.optional(v.number()),  // When student marked it complete
})
  .index("by_space", ["spaceId"])
  .index("by_space_incomplete", ["spaceId", "completedAt"])
  .index("by_document", ["documentId"]),
```

**Notes:**
- `exerciseInstanceId` references the `instanceId` attribute on Exercise nodes in the Tiptap document
- `completedAt` being undefined means homework is pending; having a value means completed
- `by_space_incomplete` index helps query pending homework (where completedAt is undefined)
- `by_document` index is useful when deleting a document to clean up homework items

### 2. Modify document Table

Update the existing `document` table definition to add space-related fields:

**Current definition:**
```typescript
document: defineTable({
  owner: v.string(),
  title: v.string(),
  content: v.optional(v.bytes()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_owner", ["owner"]),
```

**New definition:**
```typescript
document: defineTable({
  // Space-related fields (NEW)
  spaceId: v.optional(v.id("spaces")),    // Which space this lesson belongs to
  lessonNumber: v.optional(v.number()),    // Order within space (1, 2, 3...)

  // Existing fields (owner becomes optional for backward compatibility)
  owner: v.optional(v.string()),           // Changed from required to optional
  title: v.string(),
  content: v.optional(v.bytes()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["owner"])
  .index("by_space", ["spaceId"])                      // NEW
  .index("by_space_lesson", ["spaceId", "lessonNumber"]), // NEW
```

**Migration notes:**
- `owner` becomes optional because new documents will have `spaceId` instead
- Existing documents will still have `owner` but no `spaceId`
- New documents will have `spaceId` and `lessonNumber` but may not have `owner`
- Both `spaceId` and `lessonNumber` are optional to allow for gradual migration

### 3. Export Types (Optional but Recommended)

Consider creating a validators file for reusable type definitions:

**Create file:** `apps/backend/convex/validators/spaces.ts`

```typescript
import { v } from "convex/values";

export const spaceValidator = v.object({
  teacherId: v.string(),
  studentId: v.string(),
  language: v.string(),
  createdAt: v.number(),
});

export const spaceInviteValidator = v.object({
  teacherId: v.string(),
  language: v.string(),
  token: v.string(),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  usedAt: v.optional(v.number()),
  usedBy: v.optional(v.string()),
  resultingSpaceId: v.optional(v.id("spaces")),
});

export const homeworkItemValidator = v.object({
  spaceId: v.id("spaces"),
  documentId: v.id("document"),
  exerciseInstanceId: v.string(),
  markedAt: v.number(),
  completedAt: v.optional(v.number()),
});
```

## Complete Schema Addition

Here's the complete code to add to `schema.ts`:

```typescript
// Add these imports if not present
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Add to the defineSchema call:

spaces: defineTable({
  teacherId: v.string(),
  studentId: v.string(),
  language: v.string(),
  createdAt: v.number(),
})
  .index("by_teacher", ["teacherId"])
  .index("by_student", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"]),

spaceInvites: defineTable({
  teacherId: v.string(),
  language: v.string(),
  token: v.string(),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  usedAt: v.optional(v.number()),
  usedBy: v.optional(v.string()),
  resultingSpaceId: v.optional(v.id("spaces")),
})
  .index("by_token", ["token"])
  .index("by_teacher", ["teacherId"]),

homeworkItems: defineTable({
  spaceId: v.id("spaces"),
  documentId: v.id("document"),
  exerciseInstanceId: v.string(),
  markedAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_space", ["spaceId"])
  .index("by_space_incomplete", ["spaceId", "completedAt"])
  .index("by_document", ["documentId"]),
```

## Verification Steps

1. Run `pnpm dev:backend` to start the Convex dev server
2. Verify no schema errors in the console
3. Check `apps/backend/convex/_generated/api.d.ts` is regenerated with new types
4. Verify new tables appear in Convex dashboard

## Notes for AI Agent

- Do NOT modify any existing data or queries
- Do NOT remove or rename existing tables
- The `sharedDocuments` and `teacherStudents` tables should remain untouched
- Only ADD new tables and ADD new optional fields to existing tables
- After schema changes, Convex will automatically sync - no manual migration needed
- The `document` table modification only adds optional fields, so existing documents remain valid

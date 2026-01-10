# Task 10: Backend Cleanup

## Overview

Remove all legacy backend code related to the old teacher-student relationship model and document sharing. This task should only be executed after Tasks 0-9 are complete and verified working.

## Dependencies

- Tasks 0-9: All must be complete and tested

## Files to Modify

- `apps/backend/convex/schema.ts` - Remove deprecated tables
- `apps/backend/convex/documents.ts` - Remove legacy functions
- `apps/backend/convex/students.ts` - Remove or gut entirely

## Files to Delete

- `apps/backend/convex/students.ts` (if entirely obsolete)

## Implementation Details

### 1. Remove Deprecated Tables from Schema

**File:** `apps/backend/convex/schema.ts`

Remove the following table definitions entirely:

```typescript
// DELETE THIS TABLE
teacherStudents: defineTable({
  teacherId: v.string(),
  studentId: v.string(),
  joinedAt: v.number(),
})
  .index("by_teacherId", ["teacherId"])
  .index("by_studentId", ["studentId"])
  .index("by_teacher_and_student", ["teacherId", "studentId"]),

// DELETE THIS TABLE
sharedDocuments: defineTable({
  documentId: v.id("document"),
  teacherId: v.string(),
  studentId: v.string(),
  sharedAt: v.number(),
})
  .index("by_document", ["documentId"])
  .index("by_student", ["studentId"])
  .index("by_document_and_student", ["documentId", "studentId"]),
```

### 2. Clean Up Document Table

**File:** `apps/backend/convex/schema.ts`

Update the document table to remove the `owner` field (all documents now belong to spaces):

**Before:**
```typescript
document: defineTable({
  spaceId: v.optional(v.id("spaces")),
  lessonNumber: v.optional(v.number()),
  owner: v.optional(v.string()),  // REMOVE THIS
  title: v.string(),
  content: v.optional(v.bytes()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["owner"])  // REMOVE THIS INDEX
  .index("by_space", ["spaceId"])
  .index("by_space_lesson", ["spaceId", "lessonNumber"]),
```

**After:**
```typescript
document: defineTable({
  spaceId: v.id("spaces"),        // Now required, not optional
  lessonNumber: v.number(),       // Now required, not optional
  title: v.string(),
  content: v.optional(v.bytes()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_space", ["spaceId"])
  .index("by_space_lesson", ["spaceId", "lessonNumber"]),
```

### 3. Remove Legacy Document Functions

**File:** `apps/backend/convex/documents.ts`

Remove the following functions:

```typescript
// DELETE: Old document creation (owner-based)
export const createDocument = mutation({...})

// DELETE: Old document listing (owner-based)
export const getDocuments = query({...})

// DELETE: Old document access check
export const hasDocumentAccess = query({...})

// DELETE: Document sharing with students
export const shareWithStudents = mutation({...})

// DELETE: Get shared documents (for old student view)
export const getSharedDocuments = query({...})

// DELETE: Get enrolled students for sharing dialog
export const getEnrolledStudents = query({...})
```

Keep only the new space-based functions:
- `createLesson`
- `getSpaceLessons`
- `getLesson`
- `updateLesson`
- `deleteLesson`
- `reorderLessons`
- `getNextLessonNumber`
- `duplicateLesson`

Also update `getDocument` to only support space-based access:

```typescript
// REPLACE getDocument with simpler version
export const getDocument = query({
  args: {
    documentId: v.id("document"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const document = await ctx.db.get(args.documentId);
    if (!document || !document.spaceId) {
      return null;
    }

    // Validate through space only
    const space = await ctx.db.get(document.spaceId);
    if (!space) {
      return null;
    }

    if (space.teacherId !== userId && space.studentId !== userId) {
      return null;
    }

    return document;
  },
});
```

### 4. Remove or Delete Students File

**File:** `apps/backend/convex/students.ts`

This file contains the old enrollment logic. Remove entirely or gut it.

**Functions to delete:**
```typescript
// DELETE: Old invite token creation
export const createStudentInviteLinkToken = mutation({...})

// DELETE: Old join teacher flow
export const joinTeacher = mutation({...})

// DELETE: Get enrolled teachers (old student view)
export const getMyTeachers = query({...})

// DELETE: Get enrolled students (old teacher view)
export const getMyStudents = query({...})

// DELETE: Check if student is enrolled
export const isStudentEnrolled = query({...})
```

If the file becomes empty, delete it entirely.

### 5. Clean Up Any Helper Functions

Search for and remove any helper functions that reference:
- `teacherStudents` table
- `sharedDocuments` table
- `document.owner` field

Common locations:
- `apps/backend/convex/documents.ts`
- `apps/backend/convex/students.ts`
- Any `utils` or `helpers` files

### 6. Update HTTP Routes (if applicable)

**File:** `apps/backend/convex/http.ts`

If there are any HTTP routes related to the old enrollment flow, remove them.

## Verification Checklist

After cleanup, verify:

- [ ] `pnpm dev:backend` starts without errors
- [ ] No TypeScript errors in `apps/backend/`
- [ ] Schema only contains: `spaces`, `spaceInvites`, `homeworkItems`, `document` (updated), and other necessary tables
- [ ] No references to `teacherStudents` anywhere in codebase
- [ ] No references to `sharedDocuments` anywhere in codebase
- [ ] No references to `document.owner` anywhere in codebase
- [ ] Grep confirms cleanup: `grep -r "teacherStudents\|sharedDocuments" apps/backend/`

## Data Deletion Warning

**This cleanup will make old data inaccessible:**

- All `teacherStudents` records will be orphaned/deleted
- All `sharedDocuments` records will be orphaned/deleted
- Documents without `spaceId` will become inaccessible

This is intentional per user requirements - no migration path needed.

## Order of Operations

1. First, ensure all new functionality works
2. Remove functions that reference old tables
3. Remove old table definitions from schema
4. Update document table to require spaceId
5. Run backend to verify no errors
6. Clean up any remaining references

## Notes for AI Agent

- Be thorough - search entire `apps/backend/` for references
- Convex will automatically handle data orphaning when tables are removed
- The `document` table change from optional to required fields may need Convex schema migration handling
- After schema changes, existing documents without spaceId will fail validation - this is expected
- Run `grep -r` searches to ensure complete cleanup
- Check `_generated/api.d.ts` to confirm removed functions are gone

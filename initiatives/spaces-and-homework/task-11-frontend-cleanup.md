# Task 11: Frontend Cleanup

## Overview

Remove all legacy frontend code related to the old teacher-student relationship model and document sharing UI. This includes both teacher and student apps.

## Dependencies

- Task 10: Backend cleanup (APIs must be removed first to catch any missed references)

## Files to Modify/Delete

### Teacher App (`apps/teacher/`)

**Delete:**
- Old document sharing dialog/components
- Old invite link generation UI
- Old students list components

**Modify:**
- Routes to remove old pages
- Navigation to remove old links

### Student App (`apps/student/`)

**Delete:**
- Old "My Teachers" section
- Old "Shared Documents" section
- Old join flow (replaced by new invite system)

**Modify:**
- Routes to remove old pages
- Navigation updates

## Implementation Details

### 1. Teacher App Cleanup

#### Remove Old Dashboard Components

**Files to delete or heavily modify:**
```
apps/teacher/src/components/DocumentShareDialog.tsx  (DELETE)
apps/teacher/src/components/InviteStudentsSection.tsx  (DELETE if exists)
apps/teacher/src/components/StudentsList.tsx  (DELETE if exists)
```

#### Update Old Routes

**File:** `apps/teacher/src/routes/_protected/index.tsx`

The old dashboard showed:
- "Your Documents" list
- "Invite Students" section with generic link

This should now be completely replaced with the space-centric view from Task 3. Remove any remnants of:

```tsx
// DELETE any code like:
const { data: documents } = useQuery(
  convexQuery(api.documents.getDocuments, {})
);

// DELETE any code like:
const { data: students } = useQuery(
  convexQuery(api.students.getMyStudents, {})
);

// DELETE: Document sharing dialog usage
<DocumentShareDialog
  documentId={...}
  onShare={...}
/>

// DELETE: Old invite link section
<div>
  <h2>Invite Students</h2>
  <p>Share this link: {inviteLink}</p>
</div>
```

#### Remove Old Document Route Logic

**File:** `apps/teacher/src/routes/_protected/document.$id.tsx`

If this route still exists for legacy documents, either:
1. Delete the entire route (if all documents now go through `/spaces/:id/lesson/:lessonId`)
2. Or redirect to the space-based route

```tsx
// If keeping for redirect purposes:
export default function OldDocumentRoute() {
  const { id } = useParams();
  // Could redirect to appropriate space/lesson if needed
  // Or just show "Document not found - please use spaces"
  return <Navigate to="/" />;
}
```

Alternatively, delete `apps/teacher/src/routes/_protected/document.$id.tsx` entirely.

#### Clean Up Imports

Search for and remove imports of deleted APIs:

```tsx
// DELETE these imports wherever they appear:
import { api } from "@backend/convex/_generated/api";
// Remove references to:
// - api.documents.getDocuments
// - api.documents.shareWithStudents
// - api.documents.getSharedDocuments
// - api.students.getMyStudents
// - api.students.createStudentInviteLinkToken
// - api.students.joinTeacher
```

### 2. Student App Cleanup

#### Remove Old Dashboard Sections

**File:** `apps/student/src/routes/_protected/index.tsx`

The old dashboard showed:
- "Shared Documents" - flat list of all shared docs
- "My Teachers" - list of enrolled teachers

This is completely replaced by the space-centric view from Task 4. Remove:

```tsx
// DELETE any code like:
const { data: sharedDocuments } = useQuery(
  convexQuery(api.documents.getSharedDocuments, {})
);

const { data: myTeachers } = useQuery(
  convexQuery(api.students.getMyTeachers, {})
);

// DELETE: Shared documents section
<section>
  <h2>Shared Documents</h2>
  {sharedDocuments?.map(doc => (
    <DocumentCard key={doc._id} document={doc} />
  ))}
</section>

// DELETE: My teachers section
<section>
  <h2>My Teachers</h2>
  {myTeachers?.map(teacher => (
    <TeacherCard key={teacher._id} teacher={teacher} />
  ))}
</section>
```

#### Update Join Route

**File:** `apps/student/src/routes/join.$token.tsx`

The old join flow used `joinTeacher` mutation. This should now use `acceptInvite` from Task 2/4. Verify the new implementation is in place and remove any old code:

```tsx
// DELETE old mutation usage:
const joinTeacher = useMutation({
  mutationFn: useConvexMutation(api.students.joinTeacher),
});

// KEEP new mutation:
const acceptInvite = useMutation({
  mutationFn: useConvexMutation(api.spaceInvites.acceptInvite),
});
```

#### Remove Old Document Route

**File:** `apps/student/src/routes/_protected/document.$id.tsx`

If this exists for the old shared documents view, either delete it or redirect:

```tsx
// DELETE entire file, or replace with redirect:
export default function OldDocumentRoute() {
  return <Navigate to="/" />;
}
```

#### Clean Up Components

**Files to check/delete:**
```
apps/student/src/components/DocumentCard.tsx  (DELETE if only used for old shared docs)
apps/student/src/components/TeacherCard.tsx  (DELETE)
apps/student/src/components/SharedDocumentsList.tsx  (DELETE if exists)
```

### 3. Shared Package Cleanup

#### Editor Package

**File:** `packages/editor/src/components/DocumentEditor.tsx`

Remove any props or logic related to old sharing:

```tsx
// DELETE props like:
interface DocumentEditorProps {
  // ...
  sharedWith?: string[];  // DELETE
  isSharedDocument?: boolean;  // DELETE
}
```

Ensure the editor only uses space-based context.

### 4. Remove Old API Imports Everywhere

Run a grep to find all usages of removed APIs:

```bash
# Find all references to removed functions
grep -r "getDocuments\|shareWithStudents\|getSharedDocuments" apps/
grep -r "getMyStudents\|getMyTeachers\|joinTeacher" apps/
grep -r "createStudentInviteLinkToken" apps/
grep -r "teacherStudents\|sharedDocuments" apps/
```

Remove all found references.

### 5. Update Navigation/Links

#### Teacher App Navigation

If there's a sidebar or nav component, update it:

```tsx
// Old links to remove:
<Link to="/documents">Documents</Link>
<Link to="/students">Students</Link>

// New links (from Task 3):
<Link to="/">Spaces</Link>  // or /spaces
```

#### Student App Navigation

```tsx
// Old links to remove:
<Link to="/documents">Shared Documents</Link>
<Link to="/teachers">My Teachers</Link>

// New links (from Task 4):
<Link to="/">My Learning</Link>  // or /spaces
```

### 6. Clean Up Types

Remove any TypeScript types related to old models:

```tsx
// DELETE types like:
interface SharedDocument {
  documentId: string;
  teacherId: string;
  studentId: string;
  sharedAt: number;
}

interface TeacherStudent {
  teacherId: string;
  studentId: string;
  joinedAt: number;
}
```

## Verification Checklist

After cleanup:

- [ ] `pnpm dev:teacher` starts without errors
- [ ] `pnpm dev:student` starts without errors
- [ ] `pnpm check-types` passes for both apps
- [ ] No TypeScript errors related to removed APIs
- [ ] Teacher app shows only spaces (no old documents view)
- [ ] Student app shows only spaces (no old shared docs view)
- [ ] Old routes return 404 or redirect appropriately
- [ ] No console errors when navigating the apps

Run these searches to confirm:

```bash
# Should return no results:
grep -r "getDocuments" apps/teacher apps/student
grep -r "shareWithStudents" apps/teacher apps/student
grep -r "getSharedDocuments" apps/teacher apps/student
grep -r "getMyStudents" apps/teacher apps/student
grep -r "getMyTeachers" apps/teacher apps/student
grep -r "joinTeacher" apps/teacher apps/student
grep -r "teacherStudents" apps/teacher apps/student packages/
grep -r "sharedDocuments" apps/teacher apps/student packages/
```

## Order of Operations

1. Ensure Task 10 (backend cleanup) is complete
2. Remove old components from teacher app
3. Update teacher app routes and navigation
4. Remove old components from student app
5. Update student app routes and navigation
6. Clean up shared packages
7. Run type checking
8. Test both apps manually
9. Run grep searches to verify complete cleanup

## Notes for AI Agent

- Always run type checking after removals to catch broken references
- Some components may be used in multiple places - check all usages before deleting
- The new space-based routes from Tasks 3, 4, 6 should already be in place
- If a file becomes empty after removing code, delete the file
- Check for any lazy-loaded routes that might not show up in static analysis
- Verify imports in barrel files (index.ts) don't reference deleted modules

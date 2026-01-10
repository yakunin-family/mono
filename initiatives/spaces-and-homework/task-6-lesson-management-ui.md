# Task 6: Lesson Management UI

## Overview

Implement the UI for creating, viewing, editing, and managing lessons within spaces. This includes both teacher (full control) and student (view/interact) experiences.

## Dependencies

- Task 3: Teacher space UI (space detail page exists)
- Task 4: Student space UI (space detail page exists)
- Task 5: Document-space integration backend (lesson APIs exist)

## Files to Create/Modify

### Teacher App
- Create: `apps/teacher/src/routes/_protected/spaces.$id.new-lesson.tsx` - New lesson creation
- Create: `apps/teacher/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx` - Lesson editor
- Modify: `apps/teacher/src/routes/_protected/spaces.$id.tsx` - Add lesson list (from Task 3)

### Student App
- Create: `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx` - Lesson viewer

### Shared
- Modify: `packages/editor/src/components/DocumentEditor.tsx` - Add spaceId prop support

## Implementation Details

### 1. New Lesson Creation Page (Teacher)

**File:** `apps/teacher/src/routes/_protected/spaces.$id.new-lesson.tsx`

```tsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@package/ui/components/button";
import { Input } from "@package/ui/components/input";
import { Label } from "@package/ui/components/label";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewLessonPage() {
  const { id: spaceId } = useParams({ from: "/_protected/spaces/$id/new-lesson" });
  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  // Get space info for header
  const { data: space } = useQuery(
    convexQuery(api.spaces.getSpace, { spaceId })
  );

  // Get next lesson number for preview
  const { data: nextNumber } = useQuery(
    convexQuery(api.documents.getNextLessonNumber, { spaceId })
  );

  const createLesson = useMutation({
    mutationFn: useConvexMutation(api.documents.createLesson),
    onSuccess: (result) => {
      // Navigate to the new lesson editor
      navigate({
        to: "/spaces/$id/lesson/$lessonId",
        params: { id: spaceId, lessonId: result.lessonId },
      });
    },
  });

  const handleCreate = () => {
    createLesson.mutate({
      spaceId,
      title: title.trim() || "Untitled Lesson",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Back link */}
      <Link to="/spaces/$id" params={{ id: spaceId }}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {space?.studentName}'s {space?.language}
        </Button>
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Create New Lesson</h1>

      {/* Form */}
      <div className="space-y-6">
        {/* Preview of lesson number */}
        {nextNumber && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">This will be</p>
            <p className="text-lg font-semibold">Lesson #{nextNumber}</p>
          </div>
        )}

        {/* Title input */}
        <div className="space-y-2">
          <Label htmlFor="title">Lesson Title</Label>
          <Input
            id="title"
            placeholder="e.g., Passive Voice, Present Perfect, Vocabulary Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            You can change this later
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            disabled={createLesson.isPending}
          >
            {createLesson.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Lesson"
            )}
          </Button>
          <Link to="/spaces/$id" params={{ id: spaceId }}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>

        {/* Error */}
        {createLesson.error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            {createLesson.error.message}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Lesson Editor Page (Teacher)

**File:** `apps/teacher/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

```tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { DocumentEditor } from "@package/editor";
import { Button } from "@package/ui/components/button";
import { Input } from "@package/ui/components/input";
import {
  ArrowLeft,
  Save,
  Loader2,
  MoreHorizontal,
  Trash2,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@package/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@package/ui/components/alert-dialog";

export default function LessonEditorPage() {
  const { id: spaceId, lessonId } = useParams({
    from: "/_protected/spaces/$id/lesson/$lessonId",
  });
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery(
    convexQuery(api.documents.getLesson, { documentId: lessonId })
  );

  // Fetch space data for breadcrumb
  const { data: space } = useQuery(
    convexQuery(api.spaces.getSpace, { spaceId }),
    { enabled: !!lesson }
  );

  // Fetch homework for this lesson (to show in sidebar or status)
  const { data: lessonHomework } = useQuery(
    convexQuery(api.homework.getHomeworkForDocument, { documentId: lessonId }),
    { enabled: !!lesson }
  );

  // Mutations
  const updateLesson = useMutation({
    mutationFn: useConvexMutation(api.documents.updateLesson),
    onSuccess: () => {
      setIsTitleDirty(false);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteLesson = useMutation({
    mutationFn: useConvexMutation(api.documents.deleteLesson),
    onSuccess: () => {
      window.location.href = `/spaces/${spaceId}`;
    },
  });

  const duplicateLesson = useMutation({
    mutationFn: useConvexMutation(api.documents.duplicateLesson),
    onSuccess: (result) => {
      window.location.href = `/spaces/${spaceId}/lesson/${result.lessonId}`;
    },
  });

  // Initialize title from lesson
  useEffect(() => {
    if (lesson && !isTitleDirty) {
      setTitle(lesson.title);
    }
  }, [lesson, isTitleDirty]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsTitleDirty(true);
  };

  const handleTitleSave = () => {
    if (isTitleDirty && title !== lesson?.title) {
      updateLesson.mutate({ documentId: lessonId, title });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Lesson not found</p>
        <Link to="/spaces/$id" params={{ id: spaceId }}>
          <Button variant="link" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Space
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Back and title */}
          <div className="flex items-center gap-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Lesson #{lesson.lessonNumber}
              </span>
              <span className="text-muted-foreground">-</span>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="border-none bg-transparent font-semibold text-lg p-0 h-auto focus-visible:ring-0"
                style={{ width: `${Math.max(title.length, 10)}ch` }}
              />
              {isTitleDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTitleSave}
                  disabled={updateLesson.isPending}
                >
                  {updateLesson.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right: Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => duplicateLesson.mutate({ documentId: lessonId })}
                disabled={duplicateLesson.isPending}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Lesson
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Lesson
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto mt-1">
          <p className="text-sm text-muted-foreground">
            {space?.studentName} · {space?.language}
          </p>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-hidden">
        <DocumentEditor
          documentId={lessonId}
          canEdit={true}
          mode="teacher-editor"
          spaceId={spaceId}
          // Pass homework context for marking exercises
          homeworkItems={lessonHomework}
        />
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "Lesson #{lesson.lessonNumber} -{" "}
              {lesson.title}" and all associated homework. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLesson.mutate({ documentId: lessonId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### 3. Lesson Viewer Page (Student)

**File:** `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

```tsx
import { useEffect, useRef } from "react";
import { useParams, useSearch, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { DocumentEditor } from "@package/editor";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function StudentLessonPage() {
  const { id: spaceId, lessonId } = useParams({
    from: "/_protected/spaces/$id/lesson/$lessonId",
  });

  // Get search params for scroll-to-exercise functionality
  const search = useSearch({ from: "/_protected/spaces/$id/lesson/$lessonId" });
  const scrollToExercise = search.scrollToExercise as string | undefined;

  const scrolledRef = useRef(false);

  // Fetch lesson data
  const { data: lesson, isLoading } = useQuery(
    convexQuery(api.documents.getLesson, { documentId: lessonId })
  );

  // Fetch space data
  const { data: space } = useQuery(
    convexQuery(api.spaces.getSpace, { spaceId }),
    { enabled: !!lesson }
  );

  // Fetch homework for this lesson to highlight homework exercises
  const { data: lessonHomework } = useQuery(
    convexQuery(api.homework.getHomeworkForDocument, { documentId: lessonId }),
    { enabled: !!lesson }
  );

  // Scroll to exercise if specified in URL
  useEffect(() => {
    if (scrollToExercise && !scrolledRef.current) {
      // Wait for editor to render, then scroll
      const timer = setTimeout(() => {
        const exerciseElement = document.querySelector(
          `[data-exercise-instance-id="${scrollToExercise}"]`
        );
        if (exerciseElement) {
          exerciseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Add highlight effect
          exerciseElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            exerciseElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 2000);
        }
        scrolledRef.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [scrollToExercise]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Lesson not found</p>
        <Link to="/spaces/$id" params={{ id: spaceId }}>
          <Button variant="link" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const pendingHomework = lessonHomework?.filter((h) => !h.completedAt) ?? [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Back and title */}
          <div className="flex items-center gap-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div>
              <h1 className="font-semibold text-lg">
                Lesson #{lesson.lessonNumber} - {lesson.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {space?.language} with {space?.teacherName}
              </p>
            </div>
          </div>

          {/* Right: Homework status */}
          {pendingHomework.length > 0 && (
            <Badge variant="destructive">
              {pendingHomework.length} exercise{pendingHomework.length > 1 ? "s" : ""} to complete
            </Badge>
          )}
        </div>
      </header>

      {/* Editor in student mode */}
      <main className="flex-1 overflow-hidden">
        <DocumentEditor
          documentId={lessonId}
          canEdit={true} // Students can interact (fill blanks, write)
          mode="student"
          spaceId={spaceId}
          homeworkItems={lessonHomework}
        />
      </main>
    </div>
  );
}
```

### 4. Update DocumentEditor Props

**File:** `packages/editor/src/components/DocumentEditor.tsx`

Add support for space-related props:

```tsx
interface DocumentEditorProps {
  documentId: string;
  canEdit: boolean;
  mode: "student" | "teacher-lesson" | "teacher-editor";
  websocketUrl?: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onConnectedUsersChange?: (count: number) => void;
  // NEW PROPS
  spaceId?: string;
  homeworkItems?: Array<{
    _id: string;
    exerciseInstanceId: string;
    completedAt?: number;
  }>;
}
```

The `homeworkItems` prop is used to:
1. Highlight exercises that are marked as homework
2. Show homework status badges on exercises
3. Enable "Mark as Homework" / "Remove from Homework" actions in teacher mode

### 5. Route Configuration

Ensure TanStack Router picks up the new routes. The file-based routing should handle this automatically based on the file paths:

**Teacher routes:**
```
/spaces/:id                    → Space detail
/spaces/:id/new-lesson         → Create lesson
/spaces/:id/lesson/:lessonId   → Edit lesson
```

**Student routes:**
```
/spaces/:id                    → Space detail
/spaces/:id/lesson/:lessonId   → View lesson
```

### 6. Search Params Type Definition

For the scroll-to-exercise functionality, define the search params:

**File:** `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

If using explicit route definitions, add:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/spaces/$id/lesson/$lessonId")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      scrollToExercise: search.scrollToExercise as string | undefined,
    };
  },
});
```

## UI Components Required

Ensure these components are installed in both apps:

**Teacher app:**
- `dropdown-menu`
- `alert-dialog`
- `input`

**Student app:**
- `badge`

Install if missing:
```bash
cd apps/teacher
pnpx shadcn@latest add dropdown-menu

cd apps/student
pnpx shadcn@latest add badge
```

## Editor Integration Notes

The `DocumentEditor` component needs to be aware of homework context:

1. **Teacher mode**: Show "Assign as Homework" button on exercises
2. **Student mode**: Show homework badge on assigned exercises, "Mark Complete" button

This homework UI integration is detailed in Tasks 8 and 9.

## Testing Considerations

1. Create lesson flow works and navigates to editor
2. Lesson title editing auto-saves on blur
3. Delete lesson shows confirmation
4. Duplicate creates copy with "(Copy)" suffix
5. Student can view but not see teacher-only actions
6. Scroll-to-exercise works from homework link
7. Homework exercises are highlighted
8. Breadcrumb navigation works correctly
9. Loading and error states display properly
10. Mobile responsive layout

## Notes for AI Agent

- Follow existing editor page patterns from `apps/teacher/src/routes/_protected/document.$id.tsx`
- The `DocumentEditor` component already exists - just add new props
- Use inline title editing pattern (no separate edit mode)
- Lesson numbers are displayed as "Lesson #N" throughout
- Student mode should feel focused and clean - no editing UI clutter
- The scroll-to-exercise feature requires data attributes on exercise elements
- Keep the header sticky, editor takes remaining height

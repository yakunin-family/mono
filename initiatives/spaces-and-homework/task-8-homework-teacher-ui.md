# Task 8: Homework Teacher UI

## Overview

Implement the teacher-facing UI for marking exercises as homework and reviewing student completion. This includes modifications to the Exercise node view and the space detail page.

## Dependencies

- Task 6: Lesson management UI (lesson editor exists)
- Task 7: Homework backend (APIs exist)

## Files to Modify

- `packages/editor/src/extensions/ExerciseView.tsx` - Add "Assign as Homework" button
- `apps/teacher/src/routes/_protected/spaces.$id.tsx` - Add homework review section

## Files to Create

- `packages/editor/src/components/HomeworkBadge.tsx` - Visual indicator for homework status

## Implementation Details

### 1. Update ExerciseView for Homework Actions

**File:** `packages/editor/src/extensions/ExerciseView.tsx`

Add homework functionality to the existing ExerciseView component:

```tsx
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import {
  Trash2,
  Save,
  ClipboardList,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import type { EditorMode } from "../types";

interface ExerciseViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & {
    attrs: {
      instanceId?: string;
      index: number;
    };
  };
}

export function ExerciseView(props: NodeViewProps) {
  const { node, editor, deleteNode } = props as ExerciseViewProps;
  const queryClient = useQueryClient();

  // Get editor storage
  const mode = editor.storage.editorMode?.mode as EditorMode | undefined;
  const documentId = editor.storage.documentContext?.documentId as string | undefined;
  const spaceId = editor.storage.documentContext?.spaceId as string | undefined;

  const instanceId = node.attrs.instanceId;
  const exerciseIndex = node.attrs.index;

  const isTeacherMode = mode === "teacher-editor" || mode === "teacher-lesson";

  // Check if this exercise is homework
  const { data: homeworkStatus } = useQuery(
    convexQuery(api.homework.isExerciseHomework, {
      documentId: documentId!,
      exerciseInstanceId: instanceId!,
    }),
    {
      enabled: !!documentId && !!instanceId && !!spaceId,
    }
  );

  // Mutations
  const markAsHomework = useMutation({
    mutationFn: useConvexMutation(api.homework.markAsHomework),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  const removeFromHomework = useMutation({
    mutationFn: useConvexMutation(api.homework.removeFromHomework),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  // Existing save to library functionality
  const saveExercise = editor.storage.library?.saveExercise;

  const handleSaveToBank = async () => {
    if (!saveExercise) return;
    // Get exercise content and save
    const content = node.content;
    await saveExercise(`Exercise ${exerciseIndex}`, JSON.stringify(content.toJSON()));
  };

  const handleToggleHomework = () => {
    if (!documentId || !instanceId) return;

    if (homeworkStatus?.homeworkId) {
      removeFromHomework.mutate({ homeworkId: homeworkStatus.homeworkId });
    } else {
      markAsHomework.mutate({ documentId, exerciseInstanceId: instanceId });
    }
  };

  const isHomework = !!homeworkStatus?.homeworkId;
  const isCompleted = homeworkStatus?.isCompleted;
  const isToggling = markAsHomework.isPending || removeFromHomework.isPending;

  return (
    <NodeViewWrapper
      as="div"
      className="exercise-wrapper my-4 relative"
      data-exercise-instance-id={instanceId}
    >
      {/* Exercise header */}
      <div className="flex items-center justify-between mb-2 px-3 py-2 bg-muted/50 rounded-t-lg border border-b-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Exercise {exerciseIndex}</span>

          {/* Homework status badge */}
          {isHomework && (
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              className={isCompleted ? "bg-green-600" : "bg-orange-500 text-white"}
            >
              {isCompleted ? (
                <>
                  <ClipboardCheck className="w-3 h-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <ClipboardList className="w-3 h-3 mr-1" />
                  Homework
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Teacher actions */}
        {isTeacherMode && (
          <div className="flex items-center gap-1">
            {/* Homework toggle button */}
            {spaceId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleHomework}
                disabled={isToggling}
                className={isHomework ? "text-orange-600 hover:text-orange-700" : ""}
                title={isHomework ? "Remove from homework" : "Assign as homework"}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isHomework ? (
                  <ClipboardCheck className="w-4 h-4" />
                ) : (
                  <ClipboardList className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Save to bank button */}
            {saveExercise && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveToBank}
                title="Save to library"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteNode}
              className="text-destructive hover:text-destructive"
              title="Delete exercise"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Exercise content */}
      <div
        className={`
          exercise-content p-4 border rounded-b-lg
          ${isHomework && !isCompleted ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : ""}
          ${isHomework && isCompleted ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : ""}
        `}
      >
        <div className="ProseMirror-content">{props.children}</div>
      </div>
    </NodeViewWrapper>
  );
}
```

### 2. Update Editor Storage for Document Context

**File:** `packages/editor/src/extensions/DocumentContext.ts` (New Extension)

Create an extension to store document context in editor storage:

```typescript
import { Extension } from "@tiptap/core";

export interface DocumentContextOptions {
  documentId?: string;
  spaceId?: string;
}

declare module "@tiptap/core" {
  interface Storage {
    documentContext: {
      documentId?: string;
      spaceId?: string;
    };
  }
}

export const DocumentContext = Extension.create<DocumentContextOptions>({
  name: "documentContext",

  addStorage() {
    return {
      documentId: this.options.documentId,
      spaceId: this.options.spaceId,
    };
  },

  addOptions() {
    return {
      documentId: undefined,
      spaceId: undefined,
    };
  },

  onCreate() {
    this.storage.documentId = this.options.documentId;
    this.storage.spaceId = this.options.spaceId;
  },
});
```

### 3. Update DocumentEditor to Pass Context

**File:** `packages/editor/src/components/DocumentEditor.tsx`

Add the DocumentContext extension with props:

```tsx
import { DocumentContext } from "../extensions/DocumentContext";

// In the editor configuration:
const editor = useEditor({
  extensions: [
    // ... existing extensions
    DocumentContext.configure({
      documentId: props.documentId,
      spaceId: props.spaceId,
    }),
  ],
  // ...
});
```

### 4. Enhanced Space Detail with Homework Review

**File:** `apps/teacher/src/routes/_protected/spaces.$id.tsx`

Add a dedicated homework review section:

```tsx
// Add to existing space detail page

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { HomeworkReviewSection } from "@/components/HomeworkReviewSection";

// In the component:
const { data: homeworkStats } = useQuery(
  convexQuery(api.homework.getHomeworkStats, { spaceId })
);

const { data: pendingReview } = useQuery(
  convexQuery(api.homework.getSpaceHomework, { spaceId })
);

// Add to JSX:
<HomeworkReviewSection
  spaceId={spaceId}
  stats={homeworkStats}
  items={pendingReview?.filter(h => h.completedAt) ?? []}
/>
```

### 5. Homework Review Section Component

**File:** `apps/teacher/src/components/HomeworkReviewSection.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/components/card";
import { Badge } from "@package/ui/components/badge";
import { Progress } from "@package/ui/components/progress";
import { ClipboardCheck, Clock, TrendingUp } from "lucide-react";

interface HomeworkStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface HomeworkItem {
  _id: string;
  documentId: string;
  exerciseInstanceId: string;
  lessonTitle: string;
  lessonNumber: number;
  completedAt?: number;
  markedAt: number;
}

interface HomeworkReviewSectionProps {
  spaceId: string;
  stats?: HomeworkStats | null;
  items: HomeworkItem[];
}

export function HomeworkReviewSection({
  spaceId,
  stats,
  items,
}: HomeworkReviewSectionProps) {
  const completedItems = items.filter((i) => i.completedAt);
  const pendingItems = items.filter((i) => !i.completedAt);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && stats.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Homework Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <Progress value={stats.completionRate} className="h-2" />
              </div>
              <span className="text-sm font-medium">
                {stats.completionRate}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed - Ready for Review */}
      {completedItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Ready for Review</h3>
            <Badge variant="secondary">{completedItems.length}</Badge>
          </div>
          <div className="space-y-2">
            {completedItems.map((item) => (
              <Link
                key={item._id}
                to="/spaces/$id/lesson/$lessonId"
                params={{ id: spaceId, lessonId: item.documentId }}
                search={{ scrollToExercise: item.exerciseInstanceId }}
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Lesson #{item.lessonNumber} - {item.lessonTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Completed{" "}
                          {item.completedAt
                            ? new Date(item.completedAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <Badge className="bg-green-600">Review</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold">Waiting for Student</h3>
            <Badge variant="outline">{pendingItems.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <Card key={item._id} className="opacity-60">
                <CardContent className="p-3">
                  <p className="font-medium">
                    Lesson #{item.lessonNumber} - {item.lessonTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned{" "}
                    {new Date(item.markedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No homework assigned yet</p>
          <p className="text-sm mt-1">
            Open a lesson and click the clipboard icon on exercises to assign
            them as homework
          </p>
        </div>
      )}
    </div>
  );
}
```

### 6. Bulk Homework Assignment UI (Optional Enhancement)

Add a "Mark All Exercises as Homework" button to the lesson editor toolbar:

```tsx
// In lesson editor header or toolbar

import { useMutation } from "@tanstack/react-query";

function BulkHomeworkButton({ documentId, exerciseIds }) {
  const bulkMark = useMutation({
    mutationFn: useConvexMutation(api.homework.bulkMarkAsHomework),
  });

  return (
    <Button
      variant="outline"
      onClick={() => bulkMark.mutate({ documentId, exerciseInstanceIds: exerciseIds })}
      disabled={bulkMark.isPending || exerciseIds.length === 0}
    >
      <ClipboardList className="w-4 h-4 mr-2" />
      Assign All as Homework ({exerciseIds.length})
    </Button>
  );
}
```

## UI Components Required

Ensure these components are available:

```bash
cd packages/ui
pnpx shadcn@latest add badge progress

cd apps/teacher
pnpx shadcn@latest add progress
```

## Visual Design

**Homework Badge Colors:**
- **Assigned (Pending)**: Orange background (`bg-orange-500`)
- **Completed**: Green background (`bg-green-600`)

**Exercise Border Colors:**
- **Normal**: Default border
- **Homework (Pending)**: Orange border with light orange background
- **Homework (Completed)**: Green border with light green background

## Teacher Workflow

1. Teacher opens lesson editor
2. Sees exercises with current homework status
3. Clicks clipboard icon to toggle homework assignment
4. Badge appears/disappears immediately
5. Exercise gets colored border when assigned
6. In space detail, sees homework stats and items ready for review
7. Clicks item to jump to that exercise in the lesson

## Testing Considerations

1. Homework toggle works on exercises
2. Badge shows correct state
3. Exercise styling changes with homework state
4. Space detail shows correct stats
5. Review section shows completed items
6. Deep link to exercise works from review section
7. Bulk assignment works
8. Only visible in teacher mode
9. Mutations handle errors gracefully
10. Loading states during mutations

## Notes for AI Agent

- The ExerciseView already exists - add to it, don't replace it
- Follow existing patterns in the editor package
- The `instanceId` attribute on Exercise nodes is critical - ensure it exists
- Use editor storage for passing documentId/spaceId context
- Mutations should invalidate relevant queries
- Keep UI responsive during async operations
- Homework features only appear when `spaceId` is present (not for legacy documents)

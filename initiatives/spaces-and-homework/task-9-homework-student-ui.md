# Task 9: Homework Student UI

## Overview

Implement the student-facing UI for viewing homework, completing exercises, and marking homework as done. This includes modifications to the space detail page and the lesson viewer.

## Dependencies

- Task 4: Student space UI (space view exists)
- Task 6: Lesson management UI (lesson viewer exists)
- Task 7: Homework backend (APIs exist)

## Files to Modify

- `packages/editor/src/extensions/ExerciseView.tsx` - Add student homework UI (completion button)
- `apps/student/src/routes/_protected/spaces.$id.tsx` - Enhance homework section
- `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx` - Add homework completion UI

## Files to Create

- `apps/student/src/components/HomeworkCard.tsx` - Homework item component
- `apps/student/src/components/HomeworkProgress.tsx` - Progress visualization

## Implementation Details

### 1. Update ExerciseView for Student Mode

**File:** `packages/editor/src/extensions/ExerciseView.tsx`

Add student-specific homework UI (building on Task 8 changes):

```tsx
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import {
  ClipboardList,
  ClipboardCheck,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import type { EditorMode } from "../types";

export function ExerciseView(props: NodeViewProps) {
  const { node, editor } = props;
  const queryClient = useQueryClient();

  // Get editor storage
  const mode = editor.storage.editorMode?.mode as EditorMode | undefined;
  const documentId = editor.storage.documentContext?.documentId as string | undefined;
  const spaceId = editor.storage.documentContext?.spaceId as string | undefined;

  const instanceId = node.attrs.instanceId;
  const exerciseIndex = node.attrs.index;

  const isStudentMode = mode === "student";
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

  // Student mutations
  const completeHomework = useMutation({
    mutationFn: useConvexMutation(api.homework.completeHomework),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  const uncompleteHomework = useMutation({
    mutationFn: useConvexMutation(api.homework.uncompleteHomework),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });

  const isHomework = !!homeworkStatus?.homeworkId;
  const isCompleted = homeworkStatus?.isCompleted;
  const isToggling = completeHomework.isPending || uncompleteHomework.isPending;

  const handleToggleComplete = () => {
    if (!homeworkStatus?.homeworkId) return;

    if (isCompleted) {
      uncompleteHomework.mutate({ homeworkId: homeworkStatus.homeworkId });
    } else {
      completeHomework.mutate({ homeworkId: homeworkStatus.homeworkId });
    }
  };

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

          {/* Homework status badge - visible to both teacher and student */}
          {isHomework && (
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              className={
                isCompleted
                  ? "bg-green-600"
                  : "bg-orange-500 text-white"
              }
            >
              {isCompleted ? (
                <>
                  <ClipboardCheck className="w-3 h-3 mr-1" />
                  Done
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

        {/* Student actions */}
        {isStudentMode && isHomework && (
          <Button
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            onClick={handleToggleComplete}
            disabled={isToggling}
            className={
              isCompleted
                ? "border-green-600 text-green-600 hover:bg-green-50"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4 mr-1" />
                Undo
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Mark Done
              </>
            )}
          </Button>
        )}

        {/* Teacher actions (from Task 8) */}
        {isTeacherMode && (
          /* ... teacher actions here ... */
          null
        )}
      </div>

      {/* Exercise content */}
      <div
        className={`
          exercise-content p-4 border rounded-b-lg transition-colors
          ${isHomework && !isCompleted ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : ""}
          ${isHomework && isCompleted ? "border-green-300 bg-green-50/50 dark:bg-green-950/20" : ""}
        `}
      >
        <div className="ProseMirror-content">{props.children}</div>
      </div>

      {/* Completion celebration (brief animation) */}
      {isCompleted && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <ClipboardCheck className="w-6 h-6 text-green-600 animate-bounce" />
        </div>
      )}
    </NodeViewWrapper>
  );
}
```

### 2. Enhanced Student Space Detail

**File:** `apps/student/src/routes/_protected/spaces.$id.tsx`

Update the homework section with better UX:

```tsx
import { useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import { Progress } from "@package/ui/components/progress";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { HomeworkCard } from "@/components/HomeworkCard";
import { HomeworkProgress } from "@/components/HomeworkProgress";

export default function StudentSpaceDetailPage() {
  const { id: spaceId } = useParams({ from: "/_protected/spaces/$id" });

  const { data: space, isLoading } = useQuery(
    convexQuery(api.spaces.getSpace, { spaceId })
  );

  const { data: lessons } = useQuery(
    convexQuery(api.documents.getSpaceLessons, { spaceId }),
    { enabled: !!space }
  );

  const { data: homework } = useQuery(
    convexQuery(api.homework.getSpaceHomework, { spaceId }),
    { enabled: !!space }
  );

  const { data: stats } = useQuery(
    convexQuery(api.homework.getHomeworkStats, { spaceId }),
    { enabled: !!space }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <p className="text-muted-foreground">Course not found</p>
        <Link to="/">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Learning
          </Button>
        </Link>
      </div>
    );
  }

  const pendingHomework = homework?.filter((h) => !h.completedAt) ?? [];
  const completedHomework = homework?.filter((h) => h.completedAt) ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back link */}
      <Link to="/">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{space.language}</h1>
        <p className="text-muted-foreground">with {space.teacherName}</p>
      </div>

      {/* Progress Summary */}
      {stats && stats.total > 0 && (
        <HomeworkProgress stats={stats} className="mb-8" />
      )}

      {/* Homework Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            <h2 className="text-lg font-semibold">My Homework</h2>
          </div>
          {pendingHomework.length > 0 && (
            <Badge variant="destructive">{pendingHomework.length} to do</Badge>
          )}
        </div>

        {pendingHomework.length === 0 ? (
          <div className="p-8 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 text-center">
            {completedHomework.length > 0 ? (
              // All done - celebration state
              <>
                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
                  All caught up!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed all your homework. Great job!
                </p>
              </>
            ) : (
              // No homework at all
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                  No homework yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your teacher will assign homework from your lessons
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingHomework.map((item) => (
              <HomeworkCard
                key={item._id}
                item={item}
                spaceId={spaceId}
                variant="pending"
              />
            ))}
          </div>
        )}

        {/* Recently completed */}
        {completedHomework.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Show completed ({completedHomework.length})
            </summary>
            <div className="mt-3 space-y-2 opacity-60">
              {completedHomework.slice(0, 5).map((item) => (
                <HomeworkCard
                  key={item._id}
                  item={item}
                  spaceId={spaceId}
                  variant="completed"
                />
              ))}
              {completedHomework.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  +{completedHomework.length - 5} more
                </p>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Lessons Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Lessons</h2>
        </div>

        {lessons?.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">
              No lessons yet. Your teacher will add lessons here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons?.map((lesson) => {
              // Count homework in this lesson
              const lessonHomework = homework?.filter(
                (h) => h.documentId === lesson._id
              );
              const pending = lessonHomework?.filter((h) => !h.completedAt).length ?? 0;

              return (
                <Link
                  key={lesson._id}
                  to="/spaces/$id/lesson/$lessonId"
                  params={{ id: spaceId, lessonId: lesson._id }}
                >
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between">
                    <span className="font-medium">
                      Lesson #{lesson.lessonNumber} - {lesson.title}
                    </span>
                    {pending > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {pending} exercise{pending > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3. Homework Card Component

**File:** `apps/student/src/components/HomeworkCard.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@package/ui/components/card";
import { Badge } from "@package/ui/components/badge";
import { ChevronRight, ClipboardList, CheckCircle2 } from "lucide-react";

interface HomeworkItem {
  _id: string;
  documentId: string;
  exerciseInstanceId: string;
  lessonTitle: string;
  lessonNumber: number;
  markedAt: number;
  completedAt?: number;
}

interface HomeworkCardProps {
  item: HomeworkItem;
  spaceId: string;
  variant: "pending" | "completed";
}

export function HomeworkCard({ item, spaceId, variant }: HomeworkCardProps) {
  const isPending = variant === "pending";

  return (
    <Link
      to="/spaces/$id/lesson/$lessonId"
      params={{ id: spaceId, lessonId: item.documentId }}
      search={{ scrollToExercise: item.exerciseInstanceId }}
    >
      <Card
        className={`
          hover:shadow-md transition-all cursor-pointer
          ${isPending ? "border-orange-200 bg-orange-50/30 dark:bg-orange-950/10 hover:border-orange-300" : ""}
          ${!isPending ? "border-green-200 bg-green-50/30 dark:bg-green-950/10" : ""}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${isPending ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}
              `}
            >
              {isPending ? (
                <ClipboardList className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                Lesson #{item.lessonNumber} - {item.lessonTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPending
                  ? `Assigned ${new Date(item.markedAt).toLocaleDateString()}`
                  : `Completed ${new Date(item.completedAt!).toLocaleDateString()}`}
              </p>
            </div>

            {/* Action indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {isPending && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Open
                </Badge>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 4. Homework Progress Component

**File:** `apps/student/src/components/HomeworkProgress.tsx`

```tsx
import { Card, CardContent } from "@package/ui/components/card";
import { Progress } from "@package/ui/components/progress";
import { Trophy, Target, Flame } from "lucide-react";

interface HomeworkStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  recentlyCompleted?: number;
}

interface HomeworkProgressProps {
  stats: HomeworkStats;
  className?: string;
}

export function HomeworkProgress({ stats, className }: HomeworkProgressProps) {
  const isAllDone = stats.pending === 0;
  const hasStreak = (stats.recentlyCompleted ?? 0) >= 3;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isAllDone ? (
              <Trophy className="w-5 h-5 text-yellow-500" />
            ) : (
              <Target className="w-5 h-5 text-primary" />
            )}
            <span className="font-medium">
              {isAllDone ? "All Done!" : "Progress"}
            </span>
          </div>
          {hasStreak && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">On fire!</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <Progress
            value={stats.completionRate}
            className="flex-1 h-3"
          />
          <span className="text-sm font-bold w-12 text-right">
            {stats.completionRate}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {stats.completed} of {stats.total} completed
          </span>
          {stats.pending > 0 && (
            <span className="text-orange-600 font-medium">
              {stats.pending} remaining
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Lesson View with Homework Awareness

**File:** `apps/student/src/routes/_protected/spaces.$id.lesson.$lessonId.tsx`

Add homework summary to lesson header:

```tsx
// Add to existing lesson view header

const pendingInLesson = lessonHomework?.filter((h) => !h.completedAt) ?? [];

// In the header section:
{pendingInLesson.length > 0 && (
  <div className="bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 px-4 py-2">
    <div className="max-w-7xl mx-auto flex items-center gap-2 text-orange-700 dark:text-orange-400">
      <ClipboardList className="w-4 h-4" />
      <span className="text-sm font-medium">
        {pendingInLesson.length} exercise
        {pendingInLesson.length > 1 ? "s" : ""} to complete in this lesson
      </span>
    </div>
  </div>
)}
```

### 6. Completion Celebration Animation

Add a brief celebration when homework is completed:

```css
/* Add to global styles or component */

@keyframes homework-complete {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.homework-just-completed {
  animation: homework-complete 0.5s ease-out;
}
```

```tsx
// In ExerciseView, track completion state
const [justCompleted, setJustCompleted] = useState(false);

useEffect(() => {
  if (isCompleted && !justCompleted) {
    setJustCompleted(true);
    const timer = setTimeout(() => setJustCompleted(false), 1000);
    return () => clearTimeout(timer);
  }
}, [isCompleted]);

// Add class to wrapper
className={`... ${justCompleted ? 'homework-just-completed' : ''}`}
```

## UI Components Required

```bash
cd apps/student
pnpx shadcn@latest add progress card badge
```

## Student Workflow

1. **Dashboard View**
   - Student sees spaces with homework count badges
   - Opens a space to see detailed homework list

2. **Space View**
   - Progress bar shows overall completion
   - Pending homework shown prominently at top
   - Each item links to specific exercise in lesson
   - Completed homework collapsible below

3. **Lesson View**
   - Banner shows pending homework count in this lesson
   - Homework exercises have orange border and badge
   - "Mark Done" button on each homework exercise
   - Completed exercises show green border and "Done" badge

4. **Completion Flow**
   - Student fills in exercise (blanks, writing, etc.)
   - Clicks "Mark Done" button
   - Badge changes to green, border turns green
   - Can undo with "Undo" button if needed

## Visual States

| State | Badge | Border | Background |
|-------|-------|--------|------------|
| Not homework | None | Default | Default |
| Homework (pending) | Orange "Homework" | Orange | Light orange |
| Homework (done) | Green "Done" | Green | Light green |

## Testing Considerations

1. "Mark Done" button works correctly
2. "Undo" button reverts completion
3. Progress bar updates in real-time
4. Homework count in dashboard updates
5. Scroll-to-exercise works from homework link
6. Celebration animation plays on completion
7. Completed homework appears in collapsed section
8. Empty states show appropriate messages
9. Loading states during mutations
10. Mobile responsive layout

## Notes for AI Agent

- Build on existing ExerciseView from Task 8
- Student mode should feel encouraging and clean
- Progress visualization is motivational
- Completion should feel rewarding (brief animation)
- Don't overwhelm with information - focus on "what do I need to do"
- Use semantic color coding consistently (orange=pending, green=done)
- Ensure accessibility - colors should not be the only indicator
- Import Convex API from `@backend/convex/_generated/api`
- Use TypeScript strictly - no `any` types

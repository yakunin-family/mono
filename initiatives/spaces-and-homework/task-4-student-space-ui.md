# Task 4: Student Space View UI

## Overview

Redesign the student app dashboard to be space-centric. Students will see their learning spaces (organized by teacher and language) with quick access to homework and lessons.

## Dependencies

- Task 1: Space CRUD backend
- Task 2: Invite system backend

## Files to Create/Modify

### Files to Modify
- `apps/student/src/routes/_protected/index.tsx` - Main dashboard redesign
- `apps/student/src/routes/join.$token.tsx` - Update join flow for new invite system

### Files to Create
- `apps/student/src/components/SpaceCard.tsx` - Space list item component
- `apps/student/src/routes/_protected/spaces.$id.tsx` - Space detail page

## Current State Analysis

The current student dashboard shows:
1. "Shared Documents" - Flat list of all shared documents
2. "My Teachers" - List of enrolled teachers

The join flow (`join.$token.tsx`) uses the old `joinTeacher` mutation.

This needs to change to:
1. "My Learning" - List of spaces with teacher, language, and homework count
2. Updated join flow using `acceptInvite` mutation

## Implementation Details

### 1. Main Dashboard Redesign

**File:** `apps/student/src/routes/_protected/index.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { SpaceCard } from "@/components/SpaceCard";

export default function StudentDashboard() {
  const { data: spaces, isLoading } = useQuery(
    convexQuery(api.spaces.getMySpacesAsStudent, {})
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="text-muted-foreground mt-1">
          Your courses and homework
        </p>
      </div>

      {/* Spaces List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : spaces?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">
            You haven't joined any courses yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Ask your teacher for an invite link to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {spaces?.map((space) => (
            <SpaceCard key={space._id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. SpaceCard Component

**File:** `apps/student/src/components/SpaceCard.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@package/ui/components/card";
import { Badge } from "@package/ui/components/badge";
import { ChevronRight, ClipboardList } from "lucide-react";

interface SpaceCardProps {
  space: {
    _id: string;
    teacherName: string;
    language: string;
    pendingHomeworkCount: number;
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link to="/spaces/$id" params={{ id: space._id }}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            {/* Language as main title */}
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold text-lg">{space.language}</span>
              {space.pendingHomeworkCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {space.pendingHomeworkCount} to do
                </Badge>
              )}
            </div>

            {/* Teacher name */}
            <p className="text-sm text-muted-foreground">
              with {space.teacherName}
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 3. Space Detail Page

**File:** `apps/student/src/routes/_protected/spaces.$id.tsx`

```tsx
import { useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import { ArrowLeft, BookOpen, ClipboardList, CheckCircle2 } from "lucide-react";

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

      {/* Homework Section - Always visible at top */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Homework</h2>
          {pendingHomework.length > 0 && (
            <Badge variant="destructive">{pendingHomework.length}</Badge>
          )}
        </div>

        {pendingHomework.length === 0 ? (
          <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-green-700 dark:text-green-400 font-medium">
              All caught up!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No pending homework
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingHomework.map((item) => (
              <HomeworkItem
                key={item._id}
                item={item}
                spaceId={spaceId}
              />
            ))}
          </div>
        )}

        {/* Show completed homework count */}
        {completedHomework.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            {completedHomework.length} completed homework items
          </p>
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
            {lessons?.map((lesson) => (
              <Link
                key={lesson._id}
                to="/spaces/$id/lesson/$lessonId"
                params={{ id: spaceId, lessonId: lesson._id }}
              >
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="font-medium">
                    Lesson #{lesson.lessonNumber} - {lesson.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Homework item component
interface HomeworkItemProps {
  item: {
    _id: string;
    documentId: string;
    lessonTitle?: string;
    lessonNumber?: number;
    exerciseInstanceId: string;
  };
  spaceId: string;
}

function HomeworkItem({ item, spaceId }: HomeworkItemProps) {
  return (
    <Link
      to="/spaces/$id/lesson/$lessonId"
      params={{ id: spaceId, lessonId: item.documentId }}
      search={{ scrollToExercise: item.exerciseInstanceId }}
    >
      <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {item.lessonTitle
                ? `Lesson #${item.lessonNumber} - ${item.lessonTitle}`
                : "Exercise"}
            </p>
            <p className="text-sm text-muted-foreground">
              Tap to open and complete
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            To Do
          </Badge>
        </div>
      </div>
    </Link>
  );
}
```

### 4. Updated Join Flow

**File:** `apps/student/src/routes/join.$token.tsx`

```tsx
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@package/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@package/ui/components/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Assume this exists

export default function JoinPage() {
  const { token } = useParams({ from: "/join/$token" });
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Fetch invite details (no auth required)
  const { data: invite, isLoading: inviteLoading } = useQuery(
    convexQuery(api.spaceInvites.getInviteByToken, { token })
  );

  // Accept invite mutation
  const acceptInvite = useMutation({
    mutationFn: useConvexMutation(api.spaceInvites.acceptInvite),
    onSuccess: (result) => {
      // Navigate to the newly created space
      navigate({ to: "/spaces/$id", params: { id: result.spaceId } });
    },
  });

  // Loading state
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state (invalid/used/expired invite)
  if (invite?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{invite.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite - show join UI
  if (invite?.valid) {
    const handleJoin = () => {
      acceptInvite.mutate({ token });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Join {invite.language} Lessons</CardTitle>
            <CardDescription>
              {invite.teacherName} has invited you to join their {invite.language} course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show course details */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="text-xl font-semibold">{invite.language}</p>
                <p className="text-sm text-muted-foreground mt-2">Teacher</p>
                <p className="font-medium">{invite.teacherName}</p>
              </div>
            </div>

            {/* Action button */}
            {isAuthenticated ? (
              // User is logged in - can accept
              <Button
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={acceptInvite.isPending}
              >
                {acceptInvite.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Course"
                )}
              </Button>
            ) : (
              // User needs to log in first
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() =>
                    navigate({
                      to: "/login",
                      search: { redirect: `/join/${token}` },
                    })
                  }
                >
                  Sign in to Join
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href={`/signup?redirect=/join/${token}`}
                    className="underline"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            )}

            {/* Error message */}
            {acceptInvite.error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {acceptInvite.error.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback
  return null;
}
```

### 5. Success State Component (Optional Enhancement)

After accepting an invite, you might want a brief success screen:

```tsx
// Can be integrated into the join flow or space detail page
function JoinSuccess({ language, teacherName }: { language: string; teacherName: string }) {
  return (
    <div className="text-center py-8">
      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
      <h2 className="text-xl font-semibold mb-2">You're In!</h2>
      <p className="text-muted-foreground">
        You've joined {teacherName}'s {language} course.
      </p>
    </div>
  );
}
```

## Route Configuration

Ensure these routes are configured in the student app:

```
/                    → Dashboard (spaces list)
/spaces/:id          → Space detail (homework + lessons)
/spaces/:id/lesson/:lessonId → Lesson view (Task 6)
/join/:token         → Join invite flow
```

## UI Components Required

Ensure these shadcn/ui components are installed in the student app:
- `card`
- `badge`

If missing:
```bash
cd apps/student
pnpx shadcn@latest add card badge
```

## Authentication Handling

The join page needs to handle unauthenticated users:

1. Show invite details (no auth required)
2. If not logged in, show "Sign in to Join" button
3. Redirect to login with return URL
4. After login, user should land back on `/join/:token`
5. User can then click "Join Course"

This requires the login/signup pages to support a `redirect` query param.

## Deep Linking to Exercises

When student clicks on a homework item, they should be taken to the lesson with the specific exercise scrolled into view. This is handled via:

1. URL search param: `?scrollToExercise=<instanceId>`
2. Lesson view page reads this param
3. Uses `element.scrollIntoView()` on mount

Implementation of scroll behavior is in Task 6 (Lesson Management UI).

## Testing Considerations

1. Empty state shows helpful message
2. Space cards show pending homework count
3. Space detail shows homework section prominently
4. "All caught up" state when no homework
5. Join flow works for unauthenticated users
6. Join flow works for authenticated users
7. Invalid/expired invite shows error
8. Already used invite shows error
9. Deep links to homework work correctly
10. Mobile responsive layout

## Notes for AI Agent

- The student app is at `apps/student/`
- Follow existing patterns from the teacher app for consistency
- Use `@package/ui` for UI components
- Homework should be the most prominent section - students primarily care about "what do I need to do"
- The join flow must work for users who aren't logged in yet
- Ensure redirect flow preserves the invite token
- Import Convex API from `@backend/convex/_generated/api`
- Use TypeScript strictly - no `any` types

# Task 3: Teacher Space Management UI

## Overview

Redesign the teacher app dashboard to be space-centric instead of document-centric. Teachers will see a list of their students (spaces) and can create invites to add new students.

## Dependencies

- Task 1: Space CRUD backend
- Task 2: Invite system backend

## Files to Create/Modify

### Files to Modify
- `apps/teacher/src/routes/_protected/index.tsx` - Main dashboard redesign

### Files to Create
- `apps/teacher/src/components/SpaceCard.tsx` - Space list item component
- `apps/teacher/src/components/CreateInviteDialog.tsx` - Dialog for creating invites
- `apps/teacher/src/components/InvitesList.tsx` - List of pending invites
- `apps/teacher/src/routes/_protected/spaces.$id.tsx` - Space detail page (new route)

## Current State Analysis

The current teacher dashboard (`apps/teacher/src/routes/_protected/index.tsx`) shows:
1. "Your Documents" - List of documents owned by teacher
2. "Invite Students" - Generic invite link (old flow)
3. Document sharing dialog

This needs to change to:
1. "Your Students" - List of spaces (student + language)
2. "Create Invite" - New invite flow with language
3. Space detail view for managing lessons

## Implementation Details

### 1. Main Dashboard Redesign

**File:** `apps/teacher/src/routes/_protected/index.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { SpaceCard } from "@/components/SpaceCard";
import { CreateInviteDialog } from "@/components/CreateInviteDialog";
import { InvitesList } from "@/components/InvitesList";
import { Button } from "@package/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function TeacherDashboard() {
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  // Fetch spaces where user is teacher
  const { data: spaces, isLoading: spacesLoading } = useQuery(
    convexQuery(api.spaces.getMySpacesAsTeacher, {})
  );

  // Fetch pending invites
  const { data: invites, isLoading: invitesLoading } = useQuery(
    convexQuery(api.spaceInvites.getMyInvites, {})
  );

  const pendingInvites = invites?.filter((i) => i.isPending) ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Students</h1>
        <Button onClick={() => setShowCreateInvite(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Student
        </Button>
      </div>

      {/* Pending Invites Section (if any) */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Pending Invites ({pendingInvites.length})
          </h2>
          <InvitesList invites={pendingInvites} />
        </div>
      )}

      {/* Spaces List */}
      {spacesLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : spaces?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You don't have any students yet.
          </p>
          <Button onClick={() => setShowCreateInvite(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Your First Student
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {spaces?.map((space) => (
            <SpaceCard key={space._id} space={space} />
          ))}
        </div>
      )}

      {/* Create Invite Dialog */}
      <CreateInviteDialog
        open={showCreateInvite}
        onOpenChange={setShowCreateInvite}
      />
    </div>
  );
}
```

### 2. SpaceCard Component

**File:** `apps/teacher/src/components/SpaceCard.tsx`

```tsx
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@package/ui/components/card";
import { Badge } from "@package/ui/components/badge";
import { ChevronRight, BookOpen, ClipboardList } from "lucide-react";

interface SpaceCardProps {
  space: {
    _id: string;
    studentName: string;
    studentEmail: string;
    language: string;
    createdAt: number;
    lessonCount?: number;
    pendingHomeworkCount?: number;
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link to="/spaces/$id" params={{ id: space._id }}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            {/* Student name and language */}
            <div className="flex items-center gap-3 mb-1">
              <span className="font-semibold text-lg">{space.studentName}</span>
              <Badge variant="secondary">{space.language}</Badge>
            </div>

            {/* Email */}
            <p className="text-sm text-muted-foreground">{space.studentEmail}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {space.lessonCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {space.lessonCount} lessons
                </span>
              )}
              {space.pendingHomeworkCount !== undefined && space.pendingHomeworkCount > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <ClipboardList className="w-4 h-4" />
                  {space.pendingHomeworkCount} pending review
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 3. CreateInviteDialog Component

**File:** `apps/teacher/src/components/CreateInviteDialog.tsx`

```tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@package/ui/components/dialog";
import { Button } from "@package/ui/components/button";
import { Input } from "@package/ui/components/input";
import { Label } from "@package/ui/components/label";
import { Copy, Check, Loader2 } from "lucide-react";

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInviteDialog({ open, onOpenChange }: CreateInviteDialogProps) {
  const [language, setLanguage] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = useMutation({
    mutationFn: useConvexMutation(api.spaceInvites.createInvite),
    onSuccess: (result) => {
      // Construct the full invite URL
      // Note: Use the student app URL, not teacher app
      const studentAppUrl = import.meta.env.VITE_STUDENT_APP_URL || "http://localhost:3001";
      setInviteLink(`${studentAppUrl}/join/${result.token}`);
    },
  });

  const handleCreate = () => {
    if (!language.trim()) return;
    createInvite.mutate({ language: language.trim() });
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    // Reset state when closing
    setLanguage("");
    setInviteLink(null);
    setCopied(false);
    createInvite.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Student</DialogTitle>
          <DialogDescription>
            Create an invite link for a new student. Specify the language you'll be teaching them.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          // Step 1: Enter language
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  placeholder="e.g., German, Business English, French (Beginners)"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  You can use any text to describe the course
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!language.trim() || createInvite.isPending}
              >
                {createInvite.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Invite
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 2: Show invite link
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Invite Link for {language}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your student. When they click it and sign up,
                  they'll automatically join your {language} lessons.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### 4. InvitesList Component

**File:** `apps/teacher/src/components/InvitesList.tsx`

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Card, CardContent } from "@package/ui/components/card";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import { Copy, Trash2, Check } from "lucide-react";
import { useState } from "react";
import type { Id } from "@backend/convex/_generated/dataModel";

interface Invite {
  _id: Id<"spaceInvites">;
  language: string;
  token: string;
  createdAt: number;
  isPending: boolean;
}

interface InvitesListProps {
  invites: Invite[];
}

export function InvitesList({ invites }: InvitesListProps) {
  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <InviteCard key={invite._id} invite={invite} />
      ))}
    </div>
  );
}

function InviteCard({ invite }: { invite: Invite }) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const revokeInvite = useMutation({
    mutationFn: useConvexMutation(api.spaceInvites.revokeInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaceInvites"] });
    },
  });

  const studentAppUrl = import.meta.env.VITE_STUDENT_APP_URL || "http://localhost:3001";
  const inviteLink = `${studentAppUrl}/join/${invite.token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke this invite?")) {
      revokeInvite.mutate({ inviteId: invite._id });
    }
  };

  const createdDate = new Date(invite.createdAt).toLocaleDateString();

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{invite.language}</Badge>
            <span className="text-xs text-muted-foreground">
              Created {createdDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevoke}
            disabled={revokeInvite.isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5. Space Detail Page (New Route)

**File:** `apps/teacher/src/routes/_protected/spaces.$id.tsx`

```tsx
import { useParams, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@package/ui/components/button";
import { Badge } from "@package/ui/components/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@package/ui/components/alert-dialog";

export default function SpaceDetailPage() {
  const { id: spaceId } = useParams({ from: "/_protected/spaces/$id" });
  const queryClient = useQueryClient();

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

  const deleteSpace = useMutation({
    mutationFn: useConvexMutation(api.spaces.deleteSpace),
    onSuccess: () => {
      // Navigate back to dashboard
      window.location.href = "/";
    },
  });

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
        <p className="text-muted-foreground">Space not found</p>
        <Link to="/">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const pendingHomework = homework?.filter((h) => !h.completedAt) ?? [];

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{space.studentName}</h1>
            <Badge variant="secondary" className="text-base">
              {space.language}
            </Badge>
          </div>
          <p className="text-muted-foreground">{space.studentEmail}</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Space
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this space?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all lessons and homework for{" "}
                {space.studentName}'s {space.language} course. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteSpace.mutate({ spaceId: space._id })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Lessons</span>
          </div>
          <p className="text-2xl font-bold">{lessons?.length ?? 0}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm">Pending Homework</span>
          </div>
          <p className="text-2xl font-bold">{pendingHomework.length}</p>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lessons</h2>
          <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Lesson
            </Button>
          </Link>
        </div>

        {lessons?.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground mb-4">No lessons yet</p>
            <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lesson
              </Button>
            </Link>
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

      {/* Pending Homework Section */}
      {pendingHomework.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Review</h2>
          <div className="space-y-2">
            {pendingHomework.map((item) => (
              <div
                key={item._id}
                className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20"
              >
                <p className="font-medium">{item.lessonTitle}</p>
                <p className="text-sm text-muted-foreground">
                  Exercise marked as homework
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Route Configuration

Update TanStack Router configuration to include the new route:

**File:** `apps/teacher/src/routes/_protected/spaces.$id.tsx`

The file-based routing should automatically pick up this route. Ensure the route file exports a `Route` configuration if using explicit route definitions.

## Environment Variables

Add to teacher app's environment:

```env
VITE_STUDENT_APP_URL=http://localhost:3001  # Development
# VITE_STUDENT_APP_URL=https://learn.yourapp.com  # Production
```

## UI Components Required

Ensure these shadcn/ui components are installed in the teacher app:
- `dialog`
- `badge`
- `alert-dialog`
- `card`

If any are missing, install them:
```bash
cd apps/teacher
pnpx shadcn@latest add dialog badge alert-dialog card
```

## Navigation Updates

Update the main navigation/sidebar (if exists) to link to spaces dashboard instead of documents.

## Testing Considerations

1. Empty state displays correctly with CTA
2. Space cards show correct student info and stats
3. Create invite flow works end-to-end
4. Invite link copies to clipboard
5. Revoke invite works with confirmation
6. Space detail page loads with stats
7. Delete space shows confirmation and works
8. Responsive layout on mobile

## Notes for AI Agent

- Use existing UI component library (`@package/ui`)
- Follow existing patterns for queries and mutations from other pages in the teacher app
- The `convexQuery` wrapper is used for TanStack Query integration with Convex
- Use `useConvexMutation` for mutations
- Import Convex API from `@backend/convex/_generated/api`
- The student app URL should be configurable via environment variable
- Ensure proper loading and error states
- Use TypeScript strictly - no `any` types

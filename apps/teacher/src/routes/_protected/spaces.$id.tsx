import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClipboardListIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

import { HomeworkReviewSection } from "@/components/HomeworkReviewSection";

export const Route = createFileRoute("/_protected/spaces/$id")({
  component: SpaceDetailPage,
});

function SpaceDetailPage() {
  const { id: spaceId } = Route.useParams();
  const navigate = useNavigate();
  const convex = useConvex();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const spaceQuery = useQuery({
    queryKey: ["space", spaceId],
    queryFn: async () => {
      return await convex.query(api.spaces.getSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
  });

  const lessonsQuery = useQuery({
    ...convexQuery(api.documents.getSpaceLessons, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!spaceQuery.data,
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async () => {
      await convex.mutation(api.spaces.deleteSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      navigate({ to: "/" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (documentId: Id<"document">) => {
      await convex.mutation(api.documents.deleteLesson, { documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.documents.getSpaceLessons, {
          spaceId: spaceId as Id<"spaces">,
        }).queryKey,
      });
      setDeletingLessonId(null);
    },
  });

  if (spaceQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link to="/">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </header>
      </div>
    );
  }

  if (!spaceQuery.data) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link to="/">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <span className="text-muted-foreground">Space not found</span>
          </div>
        </header>
        <main className="flex-1 bg-muted p-6">
          <div className="mx-auto max-w-4xl text-center py-12">
            <p className="text-muted-foreground mb-4">
              This space does not exist or you do not have access to it.
            </p>
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const space = spaceQuery.data;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{space.studentName}</h1>
                <Badge variant="secondary" className="text-base">
                  {space.language}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {space.studentEmail}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Delete Space
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-background p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <BookOpenIcon className="size-4" />
                <span className="text-sm">Lessons</span>
              </div>
              <p className="text-2xl font-bold">{space.lessonCount ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <ClipboardListIcon className="size-4" />
                <span className="text-sm">Pending Homework</span>
              </div>
              <p className="text-2xl font-bold">
                {space.pendingHomeworkCount ?? 0}
              </p>
            </div>
          </div>

          {/* Lessons Section */}
          <div className="rounded-lg border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lessons</h2>
              <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
                <Button size="sm">
                  <PlusIcon className="size-4" />
                  New Lesson
                </Button>
              </Link>
            </div>

            {lessonsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (lessonsQuery.data?.length ?? 0) === 0 ? (
              <div className="py-8 text-center">
                <BookOpenIcon className="mx-auto mb-3 size-12 text-muted-foreground opacity-50" />
                <p className="mb-4 text-sm text-muted-foreground">
                  No lessons yet. Create your first lesson to get started.
                </p>
                <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
                  <Button>
                    <PlusIcon className="size-4" />
                    Create First Lesson
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {lessonsQuery.data?.map((lesson) => (
                  <div
                    key={lesson._id}
                    className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <Link
                      to="/spaces/$id/lesson/$lessonId"
                      params={{ id: spaceId, lessonId: lesson._id }}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {lesson.lessonNumber ?? "?"}
                        </span>
                        <span className="font-medium">{lesson.title}</span>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeletingLessonId(lesson._id);
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Homework Section */}
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Homework</h2>
            <HomeworkReviewSection spaceId={spaceId} />
          </div>
        </div>
      </main>

      {/* Delete Space Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this space?</DialogTitle>
            <DialogDescription>
              This will permanently delete all lessons and homework for{" "}
              {space.studentName}&apos;s {space.language} course. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSpaceMutation.mutate()}
              disabled={deleteSpaceMutation.isPending}
            >
              {deleteSpaceMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation Dialog */}
      <Dialog
        open={!!deletingLessonId}
        onOpenChange={(open) => !open && setDeletingLessonId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this lesson?</DialogTitle>
            <DialogDescription>
              This will permanently delete this lesson and all associated
              homework. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLessonId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingLessonId) {
                  deleteLessonMutation.mutate(
                    deletingLessonId as Id<"document">,
                  );
                }
              }}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

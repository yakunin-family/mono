import { useState } from "react";

import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import { Button, Input, Label } from "@package/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

export const Route = createFileRoute("/_protected/spaces/$id_/new-lesson")({
  component: NewLessonPage,
});

function NewLessonPage() {
  const { id: spaceId } = Route.useParams();
  const navigate = useNavigate();
  const convex = useConvex();
  const [title, setTitle] = useState("");

  const spaceQuery = useQuery({
    queryKey: ["space", spaceId],
    queryFn: async () => {
      return await convex.query(api.spaces.getSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
  });

  const nextNumberQuery = useQuery({
    ...convexQuery(api.documents.getNextLessonNumber, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!spaceQuery.data,
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonTitle: string) => {
      return await convex.mutation(api.documents.createLesson, {
        spaceId: spaceId as Id<"spaces">,
        title: lessonTitle.trim() || "Untitled Lesson",
      });
    },
    onSuccess: (result) => {
      navigate({
        to: "/spaces/$id/lesson/$lessonId",
        params: { id: spaceId, lessonId: result.lessonId },
      });
    },
  });

  const handleCreate = () => {
    createLessonMutation.mutate(title);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link to="/spaces/$id" params={{ id: spaceId }}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Create New Lesson</h1>
            {spaceQuery.data && (
              <p className="text-sm text-muted-foreground">
                {spaceQuery.data.studentName} - {spaceQuery.data.language}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-xl space-y-6">
          {nextNumberQuery.data && (
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">This will be</p>
              <p className="text-lg font-semibold">
                Lesson #{nextNumberQuery.data}
              </p>
            </div>
          )}

          <div className="space-y-4 rounded-lg border bg-background p-6">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input
                id="title"
                placeholder="e.g., Passive Voice, Present Perfect, Vocabulary Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                You can change this later
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
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

            {createLessonMutation.error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {createLessonMutation.error.message}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

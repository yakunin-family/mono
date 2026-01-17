import { api, type Id } from "@app/backend";
import { Button } from "@package/ui";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/_protected/spaces/$id_/lesson/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    template: (search.template as string | undefined) ?? undefined,
    title: (search.title as string | undefined) ?? undefined,
  }),
  component: NewLessonPage,
});

function NewLessonPage() {
  const navigate = useNavigate();
  const { id: spaceId } = Route.useParams();
  const { template: templateId, title } = Route.useSearch();
  const convex = useConvex();
  const hasStarted = useRef(false);

  const createLessonMutation = useMutation({
    mutationFn: async () => {
      return await convex.mutation(api.documents.createLesson, {
        spaceId: spaceId as Id<"spaces">,
        title: title || "Untitled Lesson",
        templateId: templateId ? (templateId as Id<"library">) : undefined,
      });
    },
    onSuccess: (result) => {
      navigate({
        to: "/spaces/$id/lesson/$lessonId",
        params: { id: spaceId, lessonId: result.lessonId },
        replace: true,
      });
    },
  });

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      createLessonMutation.mutate();
    }
  }, []);

  if (createLessonMutation.isError) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <span className="text-muted-foreground">
              Failed to create lesson
            </span>
          </div>
        </header>
        <main className="flex-1 bg-muted p-6">
          <div className="mx-auto max-w-4xl py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              {createLessonMutation.error?.message ||
                "Something went wrong while creating the lesson."}
            </p>
            <div className="flex justify-center gap-2">
              <Link to="/spaces/$id" params={{ id: spaceId }}>
                <Button variant="outline">Back to Space</Button>
              </Link>
              <Button onClick={() => createLessonMutation.mutate()}>
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Creating lesson...</p>
      </div>
    </div>
  );
}

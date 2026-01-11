import { useEffect, useMemo, useRef } from "react";

import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import { DocumentEditor, getRandomUserColor } from "@package/editor";
import { Badge, Button } from "@package/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";

import { useAuth } from "@/lib/auth-client";

export const Route = createFileRoute(
  "/_protected/spaces/$id/lesson/$lessonId",
)({
  component: StudentLessonPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      scrollToExercise: search.scrollToExercise as string | undefined,
    };
  },
});

function StudentLessonPage() {
  const navigate = useNavigate();
  const { id: spaceId, lessonId } = Route.useParams();
  const { scrollToExercise } = Route.useSearch();
  const { accessToken, user } = Route.useRouteContext();
  const convex = useConvex();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const scrolledRef = useRef(false);

  const userColor = useMemo(() => getRandomUserColor(), []);
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "Anonymous";

  const lessonQuery = useQuery({
    ...convexQuery(api.documents.getLesson, {
      documentId: lessonId as Id<"document">,
    }),
  });

  const spaceQuery = useQuery({
    queryKey: ["space", spaceId],
    queryFn: async () => {
      return await convex.query(api.spaces.getSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
    enabled: !!lessonQuery.data,
  });

  const homeworkQuery = useQuery({
    ...convexQuery(api.homework.getSpaceHomework, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!lessonQuery.data,
  });

  const lessonHomework = homeworkQuery.data?.filter(
    (h) => h.documentId === lessonId,
  );
  const pendingHomework = lessonHomework?.filter((h) => !h.completedAt) ?? [];

  useEffect(() => {
    if (scrollToExercise && !scrolledRef.current) {
      const timer = setTimeout(() => {
        const exerciseElement = document.querySelector(
          `[data-exercise-instance-id="${scrollToExercise}"]`,
        );
        if (exerciseElement) {
          exerciseElement.scrollIntoView({ behavior: "smooth", block: "center" });
          exerciseElement.classList.add(
            "ring-2",
            "ring-primary",
            "ring-offset-2",
          );
          setTimeout(() => {
            exerciseElement.classList.remove(
              "ring-2",
              "ring-primary",
              "ring-offset-2",
            );
          }, 2000);
        }
        scrolledRef.current = true;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [scrollToExercise]);

  if (lessonQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lessonQuery.data) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <span className="text-muted-foreground">Lesson not found</span>
          </div>
        </header>
        <main className="flex-1 bg-muted p-6">
          <div className="mx-auto max-w-4xl py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              This lesson does not exist or you do not have access to it.
            </p>
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button>Back to Course</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const lesson = lessonQuery.data;
  const space = spaceQuery.data;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>

            <div>
              <h1 className="text-lg font-semibold">
                Lesson #{lesson.lessonNumber} - {lesson.title}
              </h1>
              {space && (
                <p className="text-sm text-muted-foreground">
                  {space.language} with {space.teacherName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingHomework.length > 0 && (
              <Badge variant="destructive">
                {pendingHomework.length} exercise
                {pendingHomework.length > 1 ? "s" : ""} to complete
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ returnTo: "/login" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background p-6 pb-10">
        <div className="mx-auto max-w-4xl">
          <DocumentEditor
            documentId={lessonId}
            spaceId={spaceId}
            canEdit={true}
            mode="student"
            token={accessToken ?? undefined}
            userName={userName}
            userColor={userColor}
            websocketUrl={
              process.env.NODE_ENV === "development"
                ? "ws://127.0.0.1:1234"
                : "wss://collab.untitled.nikita-yakunin.dev"
            }
            convexClient={convex}
            queryClient={queryClient}
          />
        </div>
      </main>
    </div>
  );
}

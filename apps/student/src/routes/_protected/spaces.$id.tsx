import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import { Badge, Button } from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Trophy,
} from "lucide-react";

import { HomeworkCard } from "@/components/HomeworkCard";
import { HomeworkProgress } from "@/components/HomeworkProgress";
import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/spaces/$id")({
  component: SpaceDetailPage,
});

function SpaceDetailPage() {
  const navigate = useNavigate();
  const { id: spaceId } = Route.useParams();

  const { data: space, isLoading } = useQuery(
    convexQuery(api.spaces.getSpace, { spaceId: spaceId as Id<"spaces"> }),
  );

  const { data: lessons } = useQuery({
    ...convexQuery(api.documents.getSpaceLessons, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!space,
  });

  const { data: homework } = useQuery({
    ...convexQuery(api.homework.getSpaceHomework, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!space,
  });

  const { data: stats } = useQuery({
    ...convexQuery(api.homework.getHomeworkStats, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: !!space,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">Course not found</p>
        <Link to="/">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 size-4" />
            Back to My Learning
          </Button>
        </Link>
      </div>
    );
  }

  const pendingHomework = homework?.filter((h) => !h.completedAt) ?? [];
  const completedHomework = homework?.filter((h) => h.completedAt) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{space.language}</h1>
              <p className="text-sm text-muted-foreground">
                with {space.teacherName}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Progress Summary */}
          {stats && stats.total > 0 && (
            <HomeworkProgress stats={stats} className="mb-8" />
          )}

          {/* Homework Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                <h2 className="text-lg font-semibold">My Homework</h2>
              </div>
              {pendingHomework.length > 0 && (
                <Badge variant="destructive">{pendingHomework.length} to do</Badge>
              )}
            </div>

            {pendingHomework.length === 0 ? (
              <div className="rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center dark:from-green-950/20 dark:to-emerald-950/20">
                {completedHomework.length > 0 ? (
                  <>
                    <Trophy className="mx-auto mb-3 size-12 text-yellow-500" />
                    <h3 className="mb-1 text-lg font-semibold text-green-700 dark:text-green-400">
                      All caught up!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You've completed all your homework. Great job!
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mx-auto mb-3 size-12 text-green-600 opacity-50" />
                    <h3 className="mb-1 text-lg font-semibold text-muted-foreground">
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
                    item={{
                      _id: item._id,
                      documentId: item.documentId,
                      exerciseInstanceId: item.exerciseInstanceId,
                      lessonTitle: item.lessonTitle ?? "Unknown Lesson",
                      lessonNumber: item.lessonNumber ?? 0,
                      markedAt: item.markedAt,
                      completedAt: item.completedAt,
                    }}
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
                      item={{
                        _id: item._id,
                        documentId: item.documentId,
                        exerciseInstanceId: item.exerciseInstanceId,
                        lessonTitle: item.lessonTitle ?? "Unknown Lesson",
                        lessonNumber: item.lessonNumber ?? 0,
                        markedAt: item.markedAt,
                        completedAt: item.completedAt,
                      }}
                      spaceId={spaceId}
                      variant="completed"
                    />
                  ))}
                  {completedHomework.length > 5 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      +{completedHomework.length - 5} more
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Lessons Section */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="size-5" />
              <h2 className="text-lg font-semibold">Lessons</h2>
            </div>

            {lessons?.length === 0 ? (
              <div className="rounded-lg border bg-background py-8 text-center">
                <p className="text-muted-foreground">
                  No lessons yet. Your teacher will add lessons here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons?.map((lesson) => {
                  const lessonHomework = homework?.filter(
                    (h) => h.documentId === lesson._id,
                  );
                  const pending =
                    lessonHomework?.filter((h) => !h.completedAt).length ?? 0;

                  return (
                    <Link
                      key={lesson._id}
                      to="/spaces/$id/lesson/$lessonId"
                      params={{ id: spaceId, lessonId: lesson._id }}
                      search={{ scrollToExercise: undefined }}
                    >
                      <div className="cursor-pointer rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {lesson.lessonNumber ?? "?"}
                            </span>
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                          {pending > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-700"
                            >
                              {pending} exercise{pending > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

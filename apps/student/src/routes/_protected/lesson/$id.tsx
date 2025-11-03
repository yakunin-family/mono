import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { LessonEditor } from "@mono/lesson-editor";
import { Button } from "@mono/ui";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_protected/lesson/$id")({
  component: LessonViewerPage,
});

function LessonViewerPage() {
  const { id } = useParams({ from: "/_protected/lesson/$id" });
  const navigate = useNavigate();

  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [connectedUsers, setConnectedUsers] = useState(0);

  // Fetch lesson data
  const { data: lessonData, isLoading } = useQuery(
    convexQuery(api.lessons.getLesson, { lessonId: id as any }),
  );

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  if (!lessonData?.lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Lesson Not Found</h1>
        <p className="text-muted-foreground">
          This lesson doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate({ to: "/" })}>Back to Dashboard</Button>
      </div>
    );
  }

  const { lesson, canEdit, role } = lessonData;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/" })}
            >
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`size-2 rounded-full ${getStatusColor()}`} />
                <span className="text-muted-foreground capitalize">
                  {status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {connectedUsers} {connectedUsers === 1 ? "user" : "users"}{" "}
                online
              </div>
            </div>
          </div>

          {/* Lesson Metadata (Read-only) */}
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {lesson.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Role: {role}</span>
              <span>
                {canEdit ? "Full edit access" : "View and limited edit"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl">
          <LessonEditor
            lessonId={id}
            canEdit={canEdit}
            onStatusChange={setStatus}
            onConnectedUsersChange={setConnectedUsers}
          />
        </div>
      </main>
    </div>
  );
}

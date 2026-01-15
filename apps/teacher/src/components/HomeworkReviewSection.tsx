import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardCheckIcon, ClipboardListIcon, ClockIcon } from "lucide-react";

interface HomeworkReviewSectionProps {
  spaceId: string;
}

export function HomeworkReviewSection({ spaceId }: HomeworkReviewSectionProps) {
  const statsQuery = useQuery({
    ...convexQuery(api.homework.getHomeworkStats, {
      spaceId: spaceId as Id<"spaces">,
    }),
  });

  const homeworkQuery = useQuery({
    ...convexQuery(api.homework.getSpaceHomework, {
      spaceId: spaceId as Id<"spaces">,
    }),
  });

  const stats = statsQuery.data;
  const items = homeworkQuery.data ?? [];

  const completedItems = items.filter((item) => item.completedAt);
  const pendingItems = items.filter((item) => !item.completedAt);

  return (
    <div className="space-y-6">
      {stats && stats.total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Homework Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-4">
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

      {completedItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheckIcon className="size-5 text-green-600" />
            <h3 className="font-semibold">Ready for Review</h3>
            <Badge variant="secondary">{completedItems.length}</Badge>
          </div>
          <div className="space-y-2">
            {completedItems.map((item) => (
              <Link
                key={item._id}
                to="/spaces/$id/lesson/$lessonId"
                params={{ id: spaceId, lessonId: item.documentId }}
              >
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
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
                      <Badge className="bg-green-600 hover:bg-green-600">
                        Review
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pendingItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ClockIcon className="size-5 text-orange-600" />
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
                    Assigned {new Date(item.markedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !statsQuery.isLoading && (
        <div className="py-8 text-center text-muted-foreground">
          <ClipboardListIcon className="mx-auto mb-3 size-12 opacity-50" />
          <p>No homework assigned yet</p>
          <p className="mt-1 text-sm">
            Open a lesson and click the clipboard icon on exercises to assign
            them as homework
          </p>
        </div>
      )}
    </div>
  );
}

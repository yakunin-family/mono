import type { Id } from "@app/backend";
import { Badge, Card, CardContent } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, ClipboardList } from "lucide-react";

interface HomeworkItem {
  _id: Id<"homeworkItems">;
  documentId: Id<"document">;
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
        className={`cursor-pointer transition-all hover:shadow-md ${
          isPending
            ? "border-orange-200 bg-orange-50/30 hover:border-orange-300 dark:bg-orange-950/10"
            : "border-green-200 bg-green-50/30 dark:bg-green-950/10"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isPending
                  ? "bg-orange-100 text-orange-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {isPending ? (
                <ClipboardList className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                Lesson #{item.lessonNumber} - {item.lessonTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPending
                  ? `Assigned ${new Date(item.markedAt).toLocaleDateString()}`
                  : `Completed ${new Date(item.completedAt!).toLocaleDateString()}`}
              </p>
            </div>

            {/* Action indicator */}
            <div className="flex shrink-0 items-center gap-2">
              {isPending && (
                <Badge
                  variant="outline"
                  className="border-orange-300 text-orange-600"
                >
                  Open
                </Badge>
              )}
              <ChevronRight className="size-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

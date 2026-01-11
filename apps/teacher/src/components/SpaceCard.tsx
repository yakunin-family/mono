import { Badge, Card, CardContent } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { BookOpenIcon, ChevronRightIcon, ClipboardListIcon } from "lucide-react";

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
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer py-0">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-lg font-semibold">{space.studentName}</span>
              <Badge variant="secondary">{space.language}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">{space.studentEmail}</p>

            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              {space.lessonCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpenIcon className="size-4" />
                  {space.lessonCount} lessons
                </span>
              )}
              {space.pendingHomeworkCount !== undefined &&
                space.pendingHomeworkCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <ClipboardListIcon className="size-4" />
                    {space.pendingHomeworkCount} pending review
                  </span>
                )}
            </div>
          </div>

          <ChevronRightIcon className="size-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

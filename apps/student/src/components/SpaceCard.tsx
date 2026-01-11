import { Badge, Card, CardContent } from "@package/ui";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import type { Id } from "@app/backend";

interface SpaceCardProps {
  space: {
    _id: Id<"spaces">;
    teacherName: string;
    language: string;
    pendingHomeworkCount: number;
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link to="/spaces/$id" params={{ id: space._id }}>
      <Card className="cursor-pointer transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-lg font-semibold">{space.language}</span>
              {space.pendingHomeworkCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {space.pendingHomeworkCount} to do
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              with {space.teacherName}
            </p>
          </div>

          <ChevronRight className="size-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

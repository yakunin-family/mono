import { api } from "@app/backend";
import { Button } from "@package/ui";
import { Badge, Card, CardContent } from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { PlusIcon, UsersIcon } from "lucide-react";
import {
  BookOpenIcon,
  ChevronRightIcon,
  ClipboardListIcon,
} from "lucide-react";

interface SpaceCardProps {
  space: {
    _id: string;
    studentName: string;
    language: string;
    createdAt: number;
    lessonCount?: number;
    pendingHomeworkCount?: number;
  };
}

export function SpaceCard({ space }: SpaceCardProps) {
  console.log(space);

  return (
    <Link to="/spaces/$id" params={{ id: space._id }}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer py-0">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-3">
              <span className="text-lg font-semibold">{space.studentName}</span>
              <Badge variant="secondary">{space.language}</Badge>
            </div>

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

interface SpacesListProps {
  onInviteClick: () => void;
}

export function SpacesList({ onInviteClick }: SpacesListProps) {
  const convex = useConvex();

  const spacesQuery = useQuery({
    queryKey: ["spaces"],
    queryFn: async () => {
      return await convex.query(api.spaces.getMySpacesAsTeacher, {});
    },
  });

  if (spacesQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (spacesQuery.error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600">
          Error loading students
        </CardContent>
      </Card>
    );
  }

  if (!spacesQuery.data || spacesQuery.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UsersIcon className="mx-auto mb-3 size-12 text-muted-foreground opacity-50" />
          <p className="mb-4 text-sm text-muted-foreground">
            You do not have any students yet.
          </p>
          <Button onClick={onInviteClick}>
            <PlusIcon className="mr-2 size-4" />
            Invite Your First Student
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {spacesQuery.data.map((space) => (
        <SpaceCard key={space._id} space={space} />
      ))}
    </div>
  );
}

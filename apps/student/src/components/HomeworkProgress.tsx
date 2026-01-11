import { Card, CardContent, Progress } from "@package/ui";
import { Flame, Target, Trophy } from "lucide-react";

interface HomeworkStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface HomeworkProgressProps {
  stats: HomeworkStats;
  className?: string;
}

export function HomeworkProgress({ stats, className }: HomeworkProgressProps) {
  const isAllDone = stats.pending === 0;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAllDone ? (
              <Trophy className="size-5 text-yellow-500" />
            ) : (
              <Target className="size-5 text-primary" />
            )}
            <span className="font-medium">
              {isAllDone ? "All Done!" : "Progress"}
            </span>
          </div>
          {stats.completed >= 3 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="size-4" />
              <span className="text-sm font-medium">On fire!</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center gap-3">
          <Progress value={stats.completionRate} className="h-3 flex-1" />
          <span className="w-12 text-right text-sm font-bold">
            {stats.completionRate}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {stats.completed} of {stats.total} completed
          </span>
          {stats.pending > 0 && (
            <span className="font-medium text-orange-600">
              {stats.pending} remaining
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

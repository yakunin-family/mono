import { Loader2Icon, CheckCircleIcon } from "lucide-react";
import type {
  PlanningResponse,
  GeneratedExercise,
} from "../../types/exerciseGeneration";

interface GenerationStepProps {
  plan: PlanningResponse;
  generatedExercises: GeneratedExercise[];
}

/**
 * GenerationStep - Displays progress while AI generates each exercise
 * with a progress bar and list of exercises.
 */
export function GenerationStep({
  plan,
  generatedExercises,
}: GenerationStepProps) {
  const total = plan.exercises.length;
  const completed = generatedExercises.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium">Generating exercises...</p>
          <span className="text-sm text-muted-foreground">
            {completed} of {total}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {plan.exercises.map((ex) => {
          const generated = generatedExercises.find(
            (g) => g.planItemId === ex.id
          );
          return (
            <div
              key={ex.id}
              className="flex items-center gap-3 p-2 rounded-md border border-border"
            >
              {generated ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <Loader2Icon className="h-5 w-5 animate-spin text-purple-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ex.title}</p>
                <p className="text-xs text-muted-foreground">{ex.type}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

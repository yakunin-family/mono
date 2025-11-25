import { Loader2Icon } from "lucide-react";
import type { Requirements } from "../../types/exerciseGeneration";

interface PlanningStepProps {
  requirements?: Requirements;
}

/**
 * PlanningStep - Displays while AI creates the exercise plan
 * based on validated requirements.
 */
export function PlanningStep({ requirements }: PlanningStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
        <div>
          <p className="font-medium">Creating exercise plan...</p>
          <p className="text-sm text-muted-foreground">
            Designing the sequence and structure
          </p>
        </div>
      </div>

      {requirements && (
        <div className="rounded-md bg-muted p-3 text-xs space-y-1">
          <p>
            <span className="font-medium">Language:</span>{" "}
            {requirements.targetLanguage}
          </p>
          <p>
            <span className="font-medium">Level:</span> {requirements.level}
          </p>
          {requirements.topic && (
            <p>
              <span className="font-medium">Topic:</span> {requirements.topic}
            </p>
          )}
          {requirements.duration && (
            <p>
              <span className="font-medium">Duration:</span>{" "}
              {requirements.duration} minutes
            </p>
          )}
          {requirements.exerciseTypes.length > 0 && (
            <p>
              <span className="font-medium">Types:</span>{" "}
              {requirements.exerciseTypes.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

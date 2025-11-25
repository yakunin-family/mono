import { useState } from "react";
import { Button } from "@package/ui";
import { ClockIcon } from "lucide-react";
import type { PlanningResponse } from "../../types/exerciseGeneration";

interface ApprovalStepProps {
  plan: PlanningResponse;
  onApprove: () => Promise<void>;
  onCancel: () => void;
}

/**
 * ApprovalStep - Displays the generated exercise plan and allows
 * the user to approve or cancel before generation begins.
 */
export function ApprovalStep({
  plan,
  onApprove,
  onCancel,
}: ApprovalStepProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setError(null);
    setIsApproving(true);

    try {
      await onApprove();
    } catch (err) {
      console.error("Failed to approve plan:", err);
      setError(err instanceof Error ? err.message : "Failed to approve plan");
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-blue-500 pl-4">
        <p className="font-medium">Review Exercise Plan</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{plan.exercises.length} exercises</span>
          {plan.totalDuration && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{plan.totalDuration} min</span>
              </div>
            </>
          )}
        </div>
      </div>

      {plan.sequenceRationale && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Sequence Rationale:</p>
          <p className="text-muted-foreground">{plan.sequenceRationale}</p>
        </div>
      )}

      {plan.learningObjectives && plan.learningObjectives.length > 0 && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium mb-2">Learning Objectives:</p>
          <ul className="space-y-1">
            {plan.learningObjectives.map((obj, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {plan.exercises.map((ex, idx) => (
          <div
            key={ex.id}
            className="rounded-md border border-border bg-background p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium">
                    {ex.type}
                  </span>
                </div>
                <p className="font-medium text-sm">{ex.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ex.description}
                </p>
              </div>
              {ex.estimatedDuration && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="h-3 w-3" />
                  <span>{ex.estimatedDuration} min</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isApproving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isApproving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isApproving ? "Approving..." : "Approve & Generate"}
        </Button>
      </div>
    </div>
  );
}

import { Button } from "@package/ui";
import { XCircleIcon, RotateCcwIcon } from "lucide-react";

interface ErrorStepProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

/**
 * ErrorStep - Displays when the generation process fails
 * with an error message and options to retry or cancel.
 */
export function ErrorStep({ error, onRetry, onCancel }: ErrorStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-destructive/10 p-3">
        <div className="flex items-start gap-2">
          <XCircleIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive mb-1">
              Generation Failed
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={onRetry} className="flex-1">
          <RotateCcwIcon className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

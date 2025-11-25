import { Loader2Icon } from "lucide-react";

interface ValidationStepProps {
  promptText: string;
  model: string;
}

/**
 * ValidationStep - Displays while AI validates the user's prompt
 * and extracts requirements.
 */
export function ValidationStep({ promptText, model }: ValidationStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
        <div>
          <p className="font-medium">Analyzing your request...</p>
          <p className="text-sm text-muted-foreground">
            Extracting requirements and validating
          </p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="truncate">
          <span className="font-medium">Prompt:</span>{" "}
          {promptText.substring(0, 150)}
          {promptText.length > 150 && "..."}
        </p>
        <p>
          <span className="font-medium">Model:</span> {model}
        </p>
      </div>
    </div>
  );
}

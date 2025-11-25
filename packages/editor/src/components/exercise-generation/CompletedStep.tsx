import { useState } from "react";
import { Button } from "@package/ui";
import { CheckIcon, RotateCcwIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type {
  GenerationResponse,
  PlanningResponse,
} from "../../types/exerciseGeneration";

interface CompletedStepProps {
  generationResult: GenerationResponse;
  plan: PlanningResponse;
  tokensUsed?: number;
  onAccept: () => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}

/**
 * CompletedStep - Displays when generation is complete with a preview
 * and options to accept, regenerate, or discard.
 */
export function CompletedStep({
  generationResult,
  plan,
  tokensUsed,
  onAccept,
  onRegenerate,
  onDiscard,
}: CompletedStepProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-green-500 pl-4">
        <p className="font-medium text-green-600">Generation Complete!</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{generationResult.totalGenerated} exercises generated</span>
          {tokensUsed && (
            <>
              <span>•</span>
              <span>{tokensUsed} tokens used</span>
            </>
          )}
        </div>
      </div>

      {generationResult.errors && generationResult.errors.length > 0 && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive mb-1">
            Some exercises failed to generate:
          </p>
          <ul className="space-y-1">
            {generationResult.errors.map((err) => {
              const planItem = plan.exercises.find(
                (ex) => ex.id === err.planItemId
              );
              return (
                <li key={err.planItemId} className="text-xs text-muted-foreground">
                  • {planItem?.title || err.planItemId}: {err.error}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        {showPreview ? (
          <>
            <ChevronUpIcon className="h-4 w-4" />
            Hide Preview
          </>
        ) : (
          <>
            <ChevronDownIcon className="h-4 w-4" />
            Show Preview
          </>
        )}
      </button>

      {showPreview && (
        <div className="max-h-64 overflow-y-auto space-y-4 border rounded-md p-3 bg-muted/50">
          {generationResult.exercises.map((ex, idx) => {
            const content = ex.content;
            return (
              <div key={idx} className="border-b pb-3 last:border-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium">
                      {content.type}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{content.title}</p>
                  {"instructions" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.instructions}
                    </p>
                  )}
                  {/* Brief preview of content */}
                  {content.type === "multiple-choice" && "questions" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.questions.length} questions
                    </p>
                  )}
                  {content.type === "true-false" && "statements" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.statements.length} statements
                    </p>
                  )}
                  {content.type === "fill-blanks" && "items" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.items.length} items
                    </p>
                  )}
                  {content.type === "short-answer" && "questions" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.questions.length} questions
                    </p>
                  )}
                  {content.type === "text-passage" && "content" in content && (
                    <p className="text-xs text-muted-foreground">
                      {content.content.split(" ").length} words
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onRegenerate} className="flex-1">
          <RotateCcwIcon className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          Discard
        </Button>
        <Button
          onClick={onAccept}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckIcon className="h-4 w-4 mr-2" />
          Accept & Insert
        </Button>
      </div>
    </div>
  );
}

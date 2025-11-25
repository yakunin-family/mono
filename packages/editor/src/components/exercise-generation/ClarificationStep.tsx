import { useState } from "react";
import { Button } from "@package/ui";
import type { ClarificationQuestion } from "../../types/exerciseGeneration";

interface ClarificationStepProps {
  questions: ClarificationQuestion[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
}

/**
 * ClarificationStep - Displays questions from AI and collects user answers
 * to clarify missing or ambiguous requirements.
 */
export function ClarificationStep({
  questions,
  onSubmit,
}: ClarificationStepProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validate required questions
    const missing = questions
      .filter((q) => q.required && !answers[q.id])
      .map((q) => q.question);

    if (missing.length > 0) {
      setError(`Please answer: ${missing.join(", ")}`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(answers);
    } catch (err) {
      console.error("Failed to submit clarifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit answers"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-blue-500 pl-4">
        <p className="font-medium">I need more information</p>
        <p className="text-sm text-muted-foreground">
          Please answer these questions to continue
        </p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <label className="text-sm font-medium">
            {q.question}
            {q.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {q.type === "text" && (
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers({ ...answers, [q.id]: e.target.value })
              }
              placeholder="Type your answer..."
            />
          )}

          {q.type === "select" && (
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers({ ...answers, [q.id]: e.target.value })
              }
            >
              <option value="">Select an option...</option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {q.type === "multiselect" && (
            <div className="space-y-2 rounded-md border border-border bg-background p-3">
              {q.options?.map((opt) => {
                const currentValues = (answers[q.id] || "")
                  .split(",")
                  .filter(Boolean);
                const isChecked = currentValues.includes(opt);

                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...currentValues, opt]
                          : currentValues.filter((v) => v !== opt);
                        setAnswers({
                          ...answers,
                          [q.id]: updated.join(","),
                        });
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isSubmitting ? "Submitting..." : "Continue"}
      </Button>
    </div>
  );
}

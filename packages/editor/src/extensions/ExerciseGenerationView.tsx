import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  SparklesIcon,
  TrashIcon,
  Loader2Icon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@package/ui";
import { useExerciseGeneration } from "../hooks/useExerciseGeneration";
import { exerciseToTiptap } from "../utils/exerciseToTiptap";

// Step components
import { ValidationStep } from "../components/exercise-generation/ValidationStep";
import { ClarificationStep } from "../components/exercise-generation/ClarificationStep";
import { PlanningStep } from "../components/exercise-generation/PlanningStep";
import { ApprovalStep } from "../components/exercise-generation/ApprovalStep";
import { GenerationStep } from "../components/exercise-generation/GenerationStep";
import { CompletedStep } from "../components/exercise-generation/CompletedStep";
import { ErrorStep } from "../components/exercise-generation/ErrorStep";

const DEFAULT_MODEL = "openai/gpt-4o";

export function ExerciseGenerationView({
  node,
  getPos,
  editor,
  updateAttributes,
}: NodeViewProps) {
  // Node attributes
  const sessionId = node.attrs.sessionId as string | null;
  const status = node.attrs.status as "input" | "active";
  const initialPromptText = node.attrs.promptText as string;
  const initialModel = node.attrs.model as string;

  // Local state for input
  const [promptText, setPromptText] = useState(initialPromptText || "");
  const [model, setModel] = useState(initialModel || DEFAULT_MODEL);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time session data via custom hook
  const {
    session,
    validationResult,
    planResult,
    generationResult,
    currentStep,
    needsClarification,
    needsApproval,
    isCompleted,
    hasFailed,
    answerClarifications,
    approvePlan,
    isLoading,
  } = useExerciseGeneration(sessionId);

  // Session resume: If we have a sessionId but status is "input", restore active state
  useEffect(() => {
    if (sessionId && status === "input" && session && !isLoading) {
      // Check if session is in progress (not completed or failed)
      if (
        session.currentStep !== "completed" &&
        session.currentStep !== "failed"
      ) {
        updateAttributes({ status: "active" });
      }
    }
  }, [sessionId, status, session, isLoading, updateAttributes]);

  const handleStart = async () => {
    if (!promptText.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setError(null);
    setIsStarting(true);

    try {
      const startGeneration = (editor.storage as any).exerciseGeneration
        ?.startGeneration;

      if (!startGeneration) {
        throw new Error(
          "No startGeneration callback provided. Please configure the editor with onStartExerciseGeneration prop."
        );
      }

      const result = await startGeneration(promptText, model);

      updateAttributes({
        sessionId: result.sessionId,
        status: "active",
        promptText,
        model,
      });
    } catch (err) {
      console.error("Failed to start exercise generation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start generation"
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleAccept = () => {
    if (!generationResult || typeof getPos !== "function") return;

    const pos = getPos();
    if (pos === undefined) return;

    const nodeSize = editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;

    // Generate unique IDs for exercise instances
    const generateId = () =>
      `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convert each generated exercise to Tiptap nodes and wrap in Exercise node
    const exerciseNodes = generationResult.exercises.map((ex) => {
      const contentNodes = exerciseToTiptap(ex.content);

      // Wrap in Exercise node
      return {
        type: "exercise",
        attrs: { instanceId: generateId() },
        content: contentNodes,
      };
    });

    // Delete generation node and insert exercises
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + nodeSize })
      .insertContentAt(pos, exerciseNodes, { updateSelection: false })
      .run();
  };

  const handleCancel = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const nodeSize = editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;
    editor.commands.deleteRange({ from: pos, to: pos + nodeSize });
  };

  const handleRestart = () => {
    updateAttributes({
      sessionId: null,
      status: "input",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <NodeViewWrapper className="my-4 block group">
      <div className="rounded-lg border border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 p-4 shadow-sm transition-all hover:border-purple-500 hover:shadow-md">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
            <SparklesIcon className="h-4 w-4" />
            <span>Exercise Generation</span>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              contentEditable={false}
              onClick={handleCancel}
              title="Cancel generation"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div contentEditable={false}>
          {/* Input State */}
          {status === "input" && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="exercise-prompt"
                  className="mb-1.5 block text-sm text-muted-foreground"
                >
                  What exercises would you like to create?
                </label>
                <textarea
                  id="exercise-prompt"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="E.g., 'Create 5 exercises about Spanish past tense for B1 level learners'"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                  rows={3}
                  disabled={isStarting}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Tip: Press Cmd/Ctrl+Enter to generate
                </p>
              </div>

              <div>
                <label
                  htmlFor="model-select"
                  className="mb-1.5 block text-sm text-muted-foreground"
                >
                  AI Model
                </label>
                <select
                  id="model-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  disabled={isStarting}
                >
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="openai/gpt-4">GPT-4</option>
                  <option value="anthropic/claude-3-5-sonnet">
                    Claude 3.5 Sonnet
                  </option>
                  <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                </select>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleStart}
                  disabled={isStarting || !promptText.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isStarting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate Exercises
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Active State - Multi-step workflow */}
          {status === "active" && (
            <>
              {/* Loading state while initial data loads */}
              {isLoading && (
                <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
                  <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      Loading session...
                    </p>
                  </div>
                </div>
              )}

              {/* Validating */}
              {!isLoading && currentStep === "validating" && (
                <ValidationStep promptText={promptText} model={model} />
              )}

              {/* Awaiting clarification */}
              {!isLoading &&
                needsClarification &&
                validationResult?.clarificationNeeded && (
                  <ClarificationStep
                    questions={validationResult.clarificationNeeded}
                    onSubmit={answerClarifications}
                  />
                )}

              {/* Planning */}
              {!isLoading && currentStep === "planning" && (
                <PlanningStep requirements={session?.requirements} />
              )}

              {/* Awaiting approval */}
              {!isLoading && needsApproval && planResult && (
                <ApprovalStep
                  plan={planResult}
                  onApprove={approvePlan}
                  onCancel={handleCancel}
                />
              )}

              {/* Generating */}
              {!isLoading &&
                currentStep === "generating" &&
                planResult && (
                  <GenerationStep
                    plan={planResult}
                    generatedExercises={generationResult?.exercises || []}
                  />
                )}

              {/* Completed */}
              {!isLoading &&
                isCompleted &&
                generationResult &&
                planResult && (
                  <CompletedStep
                    generationResult={generationResult}
                    plan={planResult}
                    tokensUsed={session?.tokensUsed}
                    onAccept={handleAccept}
                    onRegenerate={handleRestart}
                    onDiscard={handleCancel}
                  />
                )}

              {/* Failed */}
              {!isLoading && hasFailed && (
                <ErrorStep
                  error={session?.errorMessage || "Unknown error occurred"}
                  onRetry={handleRestart}
                  onCancel={handleCancel}
                />
              )}
            </>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

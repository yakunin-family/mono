import { useConvex } from "convex/react";
import { api } from "@app/backend";
import { useEffect, useState } from "react";
import type {
  ExerciseGenerationSessionData,
  ValidationResponse,
  PlanningResponse,
  GenerationResponse,
  ExerciseGenerationSession,
  ExerciseGenerationStep,
  SessionStep,
} from "../types/exerciseGeneration";

export interface UseExerciseGenerationReturn {
  // Core data
  session: ExerciseGenerationSession | null;
  steps: ExerciseGenerationStep[];

  // Parsed step results
  validationResult: ValidationResponse | null;
  planResult: PlanningResponse | null;
  generationResult: GenerationResponse | null;

  // Current state
  currentStep: SessionStep | null;

  // Boolean state helpers
  isValidating: boolean;
  needsClarification: boolean;
  isPlanning: boolean;
  needsApproval: boolean;
  isGenerating: boolean;
  isCompleted: boolean;
  hasFailed: boolean;

  // Action methods
  answerClarifications: (answers: Record<string, string>) => Promise<void>;
  approvePlan: () => Promise<void>;

  // Loading state
  isLoading: boolean;
}

/**
 * Custom hook for managing exercise generation session state.
 * Subscribes to real-time updates from Convex and provides convenient state checks.
 */
export function useExerciseGeneration(
  sessionId: string | null
): UseExerciseGenerationReturn {
  const convex = useConvex();
  const [sessionData, setSessionData] =
    useState<ExerciseGenerationSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId || !convex) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up reactive query subscription
    const watch = convex.watchQuery(
      api.exerciseGeneration.getGenerationSession,
      {
        sessionId: sessionId as any,
      }
    );

    const unsubscribe = watch.onUpdate(() => {
      const result = watch.localQueryResult();
      setSessionData(result as ExerciseGenerationSessionData | null);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [convex, sessionId]);

  // Extract session and steps
  const session = sessionData?.session ?? null;
  const steps = sessionData?.steps ?? [];
  const currentStep = session?.currentStep ?? null;

  // Parse step results (already parsed by backend query)
  const validationResult = sessionData?.validationResult ?? null;
  const planResult = sessionData?.planResult ?? null;
  const generationResult = sessionData?.generationResult ?? null;

  // Boolean state helpers
  const isValidating = currentStep === "validating";
  const needsClarification = currentStep === "awaiting_clarification";
  const isPlanning = currentStep === "planning";
  const needsApproval = currentStep === "awaiting_approval";
  const isGenerating = currentStep === "generating";
  const isCompleted = currentStep === "completed";
  const hasFailed = currentStep === "failed";

  // Mutation wrapper: Answer clarification questions
  const answerClarifications = async (answers: Record<string, string>) => {
    if (!convex || !sessionId) {
      throw new Error("Cannot answer clarifications: missing convex or sessionId");
    }

    await convex.mutation(api.exerciseGeneration.answerClarifications, {
      sessionId: sessionId as any,
      answers: JSON.stringify(answers),
    });
  };

  // Mutation wrapper: Approve exercise plan
  const approvePlan = async () => {
    if (!convex || !sessionId) {
      throw new Error("Cannot approve plan: missing convex or sessionId");
    }

    await convex.mutation(api.exerciseGeneration.approvePlan, {
      sessionId: sessionId as any,
    });
  };

  return {
    session,
    steps,
    validationResult,
    planResult,
    generationResult,
    currentStep,
    isValidating,
    needsClarification,
    isPlanning,
    needsApproval,
    isGenerating,
    isCompleted,
    hasFailed,
    answerClarifications,
    approvePlan,
    isLoading,
  };
}

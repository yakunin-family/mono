/**
 * Type definitions for exercise generation matching backend Zod schemas.
 * Reference: apps/backend/convex/validators/exerciseGeneration.ts
 */

// Session and workflow types
export type SessionStep =
  | "validating"
  | "awaiting_clarification"
  | "planning"
  | "awaiting_approval"
  | "generating"
  | "completed"
  | "failed";

export interface ExerciseGenerationSession {
  _id: string;
  documentId: string;
  userId: string;
  initialPrompt: string;
  model: string;
  currentStep: SessionStep;
  requirements?: Requirements;
  plan?: PlanningResponse;
  tokensUsed?: number;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

// STEP 1: Validation types
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: "select" | "text" | "multiselect";
  options?: string[];
  required: boolean;
}

export interface Requirements {
  targetLanguage: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  nativeLanguage?: string;
  topic?: string;
  duration?: number;
  exerciseTypes: string[];
  additionalContext?: string;
}

export interface ValidationResponse {
  status: "ready" | "needs_clarification";
  extractedRequirements: Partial<Requirements>;
  clarificationNeeded?: ClarificationQuestion[];
  missingFields?: string[];
  reasoning?: string;
}

// STEP 2: Planning types
export interface ExercisePlanItem {
  id: string;
  type: string;
  title: string;
  description: string;
  estimatedDuration?: number;
  parameters?: {
    questionCount?: number;
    difficulty?: string;
    focusArea?: string;
    [key: string]: any;
  };
  dependencies?: string[];
}

export interface PlanningResponse {
  exercises: ExercisePlanItem[];
  totalDuration?: number;
  sequenceRationale?: string;
  learningObjectives?: string[];
  metadata?: {
    difficulty?: string;
    estimatedCompletionTime?: number;
  };
}

// STEP 3: Generation types - Exercise content schemas

// Multiple Choice
export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: MultipleChoiceOption[];
  correctAnswer: string;
  explanation?: string;
}

export interface MultipleChoiceExercise {
  type: "multiple-choice";
  title: string;
  instructions: string;
  questions: MultipleChoiceQuestion[];
}

// True/False
export interface TrueFalseStatement {
  id: string;
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
}

export interface TrueFalseExercise {
  type: "true-false";
  title: string;
  instructions: string;
  statements: TrueFalseStatement[];
}

// Fill in the Blanks
export interface FillBlanksBlank {
  correctAnswer: string;
  alternativeAnswers?: string[];
  hint?: string;
}

export interface FillBlanksItem {
  id: string;
  sentence: string;
  blanks: FillBlanksBlank[];
}

export interface FillBlanksExercise {
  type: "fill-blanks";
  title: string;
  instructions: string;
  items: FillBlanksItem[];
}

// Sequencing
export interface SequencingItem {
  id: string;
  content: string;
  correctPosition: number;
}

export interface SequencingExercise {
  type: "sequencing";
  title: string;
  instructions: string;
  items: SequencingItem[];
  context?: string;
}

// Short Answer
export interface ShortAnswerQuestion {
  id: string;
  question: string;
  expectedAnswerGuidelines?: string;
  rubric?: Array<{
    criterion: string;
    points: number;
  }>;
}

export interface ShortAnswerExercise {
  type: "short-answer";
  title: string;
  instructions: string;
  questions: ShortAnswerQuestion[];
}

// Reading Passage
export interface ReadingPassageExercise {
  type: "text-passage";
  title: string;
  content: string;
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    source?: string;
  };
}

// Discussion Prompt
export interface DiscussionPromptExercise {
  type: "discussion-prompt";
  title: string;
  prompt: string;
  guidingQuestions?: string[];
  context?: string;
}

// Writing Exercises
export interface WritingExercise {
  type:
    | "summary-writing"
    | "opinion-writing"
    | "description-writing"
    | "sentence-completion";
  title: string;
  instructions: string;
  prompt: string;
  wordCountTarget?: {
    min?: number;
    max?: number;
  };
  rubric?: Array<{
    criterion: string;
    description: string;
    maxPoints: number;
  }>;
}

// Generic fallback
export interface GenericExercise {
  type: string;
  title: string;
  instructions: string;
  content: any;
}

// Union of all exercise types
export type ExerciseContent =
  | MultipleChoiceExercise
  | TrueFalseExercise
  | FillBlanksExercise
  | SequencingExercise
  | ShortAnswerExercise
  | ReadingPassageExercise
  | DiscussionPromptExercise
  | WritingExercise
  | GenericExercise;

// Generated exercise wrapper
export interface GeneratedExercise {
  planItemId: string;
  content: ExerciseContent;
  metadata?: {
    generatedAt: number;
    tokensUsed?: number;
  };
}

export interface GenerationResponse {
  exercises: GeneratedExercise[];
  totalGenerated: number;
  errors?: Array<{
    planItemId: string;
    error: string;
  }>;
}

// Step record from database
export interface ExerciseGenerationStep {
  _id: string;
  sessionId: string;
  stepType: "validation" | "planning" | "generation";
  status: "pending" | "processing" | "completed" | "failed";
  input: string;
  output?: string;
  tokensUsed?: number;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

// Full session data with parsed results (from getGenerationSession query)
export interface ExerciseGenerationSessionData {
  session: ExerciseGenerationSession;
  steps: ExerciseGenerationStep[];
  validationResult: ValidationResponse | null;
  planResult: PlanningResponse | null;
  generationResult: GenerationResponse | null;
}

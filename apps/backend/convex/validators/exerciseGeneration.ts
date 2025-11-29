import { z } from "zod";

/**
 * STEP 1: VALIDATION
 * Validates the user's prompt and extracts requirements
 */

export const clarificationQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["select", "text", "multiselect"]),
  options: z.array(z.string()).optional(), // For select/multiselect
  required: z.boolean().default(true),
});

export const requirementsSchema = z.object({
  targetLanguage: z.string(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  nativeLanguage: z.string().optional(),
  topic: z.string().optional(),
  duration: z.number().optional(), // in minutes
  exerciseTypes: z.array(z.string()),
  additionalContext: z.string().optional(),
});

export const validationResponseSchema = z.object({
  status: z.enum(["ready", "needs_clarification"]),
  extractedRequirements: requirementsSchema.partial(),
  clarificationNeeded: z.array(clarificationQuestionSchema).optional(),
  missingFields: z.array(z.string()).optional(),
  reasoning: z.string().optional(), // Why clarification is needed
});

export type ValidationResponse = z.infer<typeof validationResponseSchema>;
export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;
export type Requirements = z.infer<typeof requirementsSchema>;

/**
 * STEP 2: PLANNING
 * Creates a structured plan for exercises to generate
 */

export const exercisePlanItemSchema = z.object({
  id: z.string(), // Unique identifier for this planned exercise
  type: z.string(), // From exercise types enum
  title: z.string(),
  description: z.string(),
  estimatedDuration: z.number().optional(), // in minutes
  parameters: z
    .object({
      // Common parameters
      questionCount: z.number().optional(),
      difficulty: z.string().optional(),
      focusArea: z.string().optional(),
      // Type-specific parameters (stored as arbitrary JSON)
      [z.string().toString()]: z.any(),
    })
    .passthrough()
    .optional(),
  dependencies: z.array(z.string()).optional(), // IDs of exercises that should come before this one
});

export const planningResponseSchema = z.object({
  exercises: z.array(exercisePlanItemSchema),
  totalDuration: z.number().optional(),
  sequenceRationale: z.string().optional(), // Explanation of why exercises are ordered this way
  learningObjectives: z.array(z.string()).optional(),
  metadata: z
    .object({
      difficulty: z.string().optional(),
      estimatedCompletionTime: z.number().optional(),
    })
    .optional(),
});

export type PlanningResponse = z.infer<typeof planningResponseSchema>;
export type ExercisePlanItem = z.infer<typeof exercisePlanItemSchema>;

/**
 * STEP 3: GENERATION
 * Generates actual exercise content based on the approved plan
 */

// Multiple Choice Exercise
export const multipleChoiceOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const multipleChoiceQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(multipleChoiceOptionSchema),
  correctAnswer: z.string(), // ID of correct option
  explanation: z.string().optional(),
});

export const multipleChoiceExerciseSchema = z.object({
  type: z.literal("multiple-choice"),
  title: z.string(),
  instructions: z.string(),
  questions: z.array(multipleChoiceQuestionSchema),
});

// True/False Exercise
export const trueFalseStatementSchema = z.object({
  id: z.string(),
  statement: z.string(),
  correctAnswer: z.boolean(),
  explanation: z.string().optional(),
});

export const trueFalseExerciseSchema = z.object({
  type: z.literal("true-false"),
  title: z.string(),
  instructions: z.string(),
  statements: z.array(trueFalseStatementSchema),
});

// Fill in the Blanks Exercise
export const fillBlanksItemSchema = z.object({
  id: z.string(),
  sentence: z.string(), // Contains [[blank]] placeholders (unnumbered)
  blanks: z.array(
    z.object({
      correctAnswer: z.string(),
      alternativeAnswers: z.array(z.string()).optional(),
      hint: z.string().optional(),
    }),
  ),
});

export const fillBlanksExerciseSchema = z.object({
  type: z.literal("fill-blanks"),
  title: z.string(),
  instructions: z.string(),
  items: z.array(fillBlanksItemSchema),
});

// Sequencing Exercise
export const sequencingItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  correctPosition: z.number(), // 1-indexed
});

export const sequencingExerciseSchema = z.object({
  type: z.literal("sequencing"),
  title: z.string(),
  instructions: z.string(),
  items: z.array(sequencingItemSchema),
  context: z.string().optional(), // Background information
});

// Short Answer Exercise
export const shortAnswerQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  expectedAnswerGuidelines: z.string().optional(), // For teachers
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        points: z.number(),
      }),
    )
    .optional(),
});

export const shortAnswerExerciseSchema = z.object({
  type: z.literal("short-answer"),
  title: z.string(),
  instructions: z.string(),
  questions: z.array(shortAnswerQuestionSchema),
});

// Reading Passage (Material Provider)
export const readingPassageExerciseSchema = z.object({
  type: z.literal("text-passage"),
  title: z.string(),
  content: z.string(), // The actual text to read
  metadata: z
    .object({
      wordCount: z.number().optional(),
      readingTime: z.number().optional(), // minutes
      source: z.string().optional(),
    })
    .optional(),
});

// Discussion Prompt
export const discussionPromptExerciseSchema = z.object({
  type: z.literal("discussion-prompt"),
  title: z.string(),
  prompt: z.string(),
  guidingQuestions: z.array(z.string()).optional(),
  context: z.string().optional(),
});

// Writing Exercise schemas (split into separate schemas for discriminated union)
const baseWritingSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  prompt: z.string(),
  wordCountTarget: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  rubric: z
    .array(
      z.object({
        criterion: z.string(),
        description: z.string(),
        maxPoints: z.number(),
      }),
    )
    .optional(),
});

export const summaryWritingExerciseSchema = baseWritingSchema.extend({
  type: z.literal("summary-writing"),
});

export const opinionWritingExerciseSchema = baseWritingSchema.extend({
  type: z.literal("opinion-writing"),
});

export const descriptionWritingExerciseSchema = baseWritingSchema.extend({
  type: z.literal("description-writing"),
});

export const sentenceCompletionExerciseSchema = baseWritingSchema.extend({
  type: z.literal("sentence-completion"),
});

// Union type for all writing exercises
export const writingExerciseSchema = z.union([
  summaryWritingExerciseSchema,
  opinionWritingExerciseSchema,
  descriptionWritingExerciseSchema,
  sentenceCompletionExerciseSchema,
]);

// Union of all exercise types
export const exerciseContentSchema = z.discriminatedUnion("type", [
  multipleChoiceExerciseSchema,
  trueFalseExerciseSchema,
  fillBlanksExerciseSchema,
  sequencingExerciseSchema,
  shortAnswerExerciseSchema,
  readingPassageExerciseSchema,
  discussionPromptExerciseSchema,
  summaryWritingExerciseSchema,
  opinionWritingExerciseSchema,
  descriptionWritingExerciseSchema,
  sentenceCompletionExerciseSchema,
]);

export const generatedExerciseSchema = z.object({
  planItemId: z.string(), // Links back to the plan
  content: exerciseContentSchema,
  metadata: z
    .object({
      generatedAt: z.number(),
      tokensUsed: z.number().optional(),
    })
    .optional(),
});

export const generationResponseSchema = z.object({
  exercises: z.array(generatedExerciseSchema),
  totalGenerated: z.number(),
  errors: z
    .array(
      z.object({
        planItemId: z.string(),
        error: z.string(),
      }),
    )
    .optional(),
});

export type GenerationResponse = z.infer<typeof generationResponseSchema>;
export type GeneratedExercise = z.infer<typeof generatedExerciseSchema>;
export type ExerciseContent = z.infer<typeof exerciseContentSchema>;

// Specific exercise types exports
export type MultipleChoiceExercise = z.infer<
  typeof multipleChoiceExerciseSchema
>;
export type TrueFalseExercise = z.infer<typeof trueFalseExerciseSchema>;
export type FillBlanksExercise = z.infer<typeof fillBlanksExerciseSchema>;
export type SequencingExercise = z.infer<typeof sequencingExerciseSchema>;
export type ShortAnswerExercise = z.infer<typeof shortAnswerExerciseSchema>;
export type ReadingPassageExercise = z.infer<
  typeof readingPassageExerciseSchema
>;
export type DiscussionPromptExercise = z.infer<
  typeof discussionPromptExerciseSchema
>;
export type WritingExercise = z.infer<typeof writingExerciseSchema>;

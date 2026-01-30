import { createTool } from "@convex-dev/agent";
import { tool } from "ai";
import { z } from "zod";

import { schemas } from "./operations";
import analyzeImagesPrompt from "./skills/analyze-images.md";
import editDocumentPrompt from "./skills/edit-document.md";
import exerciseFillBlanksPrompt from "./skills/exercises/exercise-fill-blanks.md";
import exerciseMultipleChoicePrompt from "./skills/exercises/exercise-multiple-choice.md";
import exerciseSequencingPrompt from "./skills/exercises/exercise-sequencing.md";
import exerciseShortAnswerPrompt from "./skills/exercises/exercise-short-answer.md";
import exerciseTrueFalsePrompt from "./skills/exercises/exercise-true-false.md";
import exerciseWritingTypesPrompt from "./skills/exercises/exercise-writing-types.md";
import patchDocumentPrompt from "./skills/patch-document.md";

/**
 * Map skill names to their getter functions
 */
const SKILL_GETTERS: Record<string, string> = {
  "fill-blanks": exerciseFillBlanksPrompt,
  "multiple-choice": exerciseMultipleChoicePrompt,
  sequencing: exerciseSequencingPrompt,
  "short-answer": exerciseShortAnswerPrompt,
  "true-false": exerciseTrueFalsePrompt,
  "writing-exercises": exerciseWritingTypesPrompt,
};

/**
 * Tool to load specialized instructions for creating exercises
 */
export const loadSkill = createTool({
  description:
    "Load detailed instructions for creating specific types of exercises. Always use this before creating exercises to ensure correct formatting and guidelines.",
  args: z.object({
    skill: z
      .enum(Object.keys(SKILL_GETTERS))
      .describe("The type of exercise skill to load"),
  }),
  handler: async (_ctx, { skill }) => {
    return { success: true, instructions: SKILL_GETTERS[skill] };
  },
});

/**
 * Tool to edit the document content (full replacement)
 */
export const editDocument = createTool({
  description: editDocumentPrompt,
  args: z.object({
    documentXml: z
      .string()
      .describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("One-sentence summary of the changes made"),
  }),
  handler: async (_ctx, { documentXml, summary }) => {
    return {
      success: true,
      documentXml,
      summary,
    };
  },
});

/**
 * Tool to apply surgical edits to the document using operations.
 *
 * This is more efficient than editDocument for small changes because
 * it only requires generating the changed parts, not the entire document.
 */
export const patchDocument = createTool({
  description: patchDocumentPrompt,
  args: z.object({
    operations: z
      .array(schemas.DocumentOperationSchema)
      .describe("Array of operations to apply to the document"),
    summary: z
      .string()
      .optional()
      .describe("Brief description of changes made"),
  }),
  handler: async (_ctx, { operations, summary }) => {
    // Basic validation - operations array should not be empty
    if (operations.length === 0) {
      return {
        success: false,
        error: "At least one operation is required",
      };
    }

    // Return operations as JSON string to avoid Convex document nesting limits.
    // The @convex-dev/agent stores tool outputs in documents, and deeply nested
    // content (like multiple-choice with lists) can exceed the 16-level limit.
    return {
      success: true,
      operationsJson: JSON.stringify(operations),
      summary,
    };
  },
});

/**
 * Tool to analyze images in the document.
 *
 * This tool has no execute function, implementing the human-in-the-loop pattern
 * from Convex Agent docs. When the agent calls this tool, the framework saves
 * the tool call but does not execute it, waiting for human intervention to
 * provide the analysis results.
 */
export const analyzeImages = tool({
  description: analyzeImagesPrompt,
  inputSchema: z.object({
    storageIds: z
      .array(z.string())
      .describe("Storage IDs of images to analyze"),
    reason: z
      .string()
      .describe(
        "Explain to the user why you need to analyze these images and what you're looking for",
      ),
  }),
});

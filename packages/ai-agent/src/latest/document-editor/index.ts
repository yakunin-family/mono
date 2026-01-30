import { z } from "zod";

import { schemas } from "./operations";
import analyzeImagesPrompt from "./skills/analyze-images.md";
import editDocumentPrompt from "./skills/edit-document.md";
import patchDocumentPrompt from "./skills/patch-document.md";

// TODO, not important right now
// export const LOADABLE_CHAT_SKILL_NAMES = [
//   "fill-blanks",
//   "multiple-choice",
//   "sequencing",
//   "short-answer",
//   "true-false",
//   "writing-exercises",
// ] as const;
// export type LoadableChatSkillName = (typeof LOADABLE_CHAT_SKILL_NAMES)[number];

export const skillRegistry = {
  "edit-document": {
    description: editDocumentPrompt,
    args: z.object({
      documentXml: z
        .string()
        .describe("Complete document XML wrapped in <lesson> tags"),
      summary: z.string().describe("One-sentence summary of the changes made"),
    }),
  },
  "patch-document": {
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
  },
  "analyze-images": {
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
  },
} as const;

export * from "./operations";

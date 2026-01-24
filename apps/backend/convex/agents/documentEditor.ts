import { Agent, createTool } from "@convex-dev/agent";
import { gateway } from "ai";
import { z } from "zod";

import { components } from "../_generated/api";
import {
  getChatBasePrompt,
  getSkillFillBlanks,
  getSkillMultipleChoice,
  getSkillSequencing,
  getSkillShortAnswer,
  getSkillTrueFalse,
  getSkillWritingExercises,
  CHAT_SKILL_NAMES,
  type ChatSkillName,
} from "../_generated_prompts";

/**
 * Map skill names to their getter functions
 */
const SKILL_GETTERS: Record<ChatSkillName, () => string> = {
  "fill-blanks": getSkillFillBlanks,
  "multiple-choice": getSkillMultipleChoice,
  sequencing: getSkillSequencing,
  "short-answer": getSkillShortAnswer,
  "true-false": getSkillTrueFalse,
  "writing-exercises": getSkillWritingExercises,
};

/**
 * Display text shown to users when a skill is being loaded
 */
const SKILL_DISPLAY_TEXT: Record<ChatSkillName, string> = {
  "fill-blanks": "Checking fill-blanks rules",
  "multiple-choice": "Checking multiple-choice rules",
  sequencing: "Checking sequencing rules",
  "short-answer": "Checking short-answer rules",
  "true-false": "Checking true-false rules",
  "writing-exercises": "Checking writing exercise rules",
};

/**
 * Tool to load specialized instructions for creating exercises
 */
const loadSkill = createTool({
  description:
    "Load detailed instructions for creating specific types of exercises. Always use this before creating exercises to ensure correct formatting and guidelines.",
  args: z.object({
    skill: z
      .enum(CHAT_SKILL_NAMES)
      .describe("The type of exercise skill to load"),
  }),
  handler: async (
    _ctx,
    { skill },
  ): Promise<{ success: boolean; instructions: string }> => {
    const getter = SKILL_GETTERS[skill];
    const instructions = getter();
    return { success: true, instructions };
  },
});

/**
 * Tool to edit the document content
 */
const editDocument = createTool({
  description:
    "Replace the document content with new XML. Only use when the user has explicitly requested changes to the document. Always return the COMPLETE document, not just the changed parts.",
  args: z.object({
    documentXml: z
      .string()
      .describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("One-sentence summary of the changes made"),
  }),
  handler: async (
    _ctx,
    { documentXml, summary },
  ): Promise<{
    success: boolean;
    documentXml?: string;
    summary?: string;
    error?: string;
  }> => {
    // Validate XML structure
    const trimmed = documentXml.trim();
    if (!trimmed.startsWith("<lesson>") || !trimmed.endsWith("</lesson>")) {
      return {
        success: false,
        error: "Document must be wrapped in <lesson> tags",
      };
    }

    // Return the document XML for the frontend to apply
    return {
      success: true,
      documentXml: trimmed,
      summary,
    };
  },
});

/**
 * Document Editor Agent
 *
 * An AI assistant that helps language teachers create and edit educational documents.
 * It can have conversations, load specialized exercise creation instructions, and
 * modify documents only when explicitly requested.
 */
export const documentEditorAgent = new Agent(components.agent, {
  name: "Document Editor",
  chat: gateway("openai/gpt-4o-mini"),
  instructions: getChatBasePrompt(),
  tools: { loadSkill, editDocument },
});

/**
 * Export skill display text for UI rendering
 */
export { SKILL_DISPLAY_TEXT };

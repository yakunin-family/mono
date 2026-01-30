import { Agent, createTool } from "@convex-dev/agent";
import { latest } from "@package/ai-agent";
import { gateway, stepCountIs, tool } from "ai";
import { z } from "zod";

import { components } from "../_generated/api";
import {
  CHAT_SKILL_NAMES,
  type ChatSkillName,
  getChatBasePrompt,
  getSkillFillBlanks,
  getSkillMultipleChoice,
  getSkillSequencing,
  getSkillShortAnswer,
  getSkillTrueFalse,
  getSkillWritingExercises,
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
 * Tool to edit the document content (full replacement)
 */
const editDocument = createTool({
  ...latest.skillRegistry["edit-document"],
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
 * Tool to apply surgical edits to the document using operations.
 *
 * This is more efficient than editDocument for small changes because
 * it only requires generating the changed parts, not the entire document.
 */
const patchDocument = createTool({
  ...latest.skillRegistry["patch-document"],
  handler: async (
    _ctx,
    { operations, summary },
  ): Promise<{
    success: boolean;
    operationsJson?: string;
    summary?: string;
    error?: string;
  }> => {
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
const analyzeImages = tool({
  description:
    "Analyze images in the document to understand their visual content. Use when the user's question requires understanding what's in an image.",
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

/**
 * Document Editor Agent
 *
 * An AI assistant that helps language teachers create and edit educational documents.
 * It can have conversations, load specialized exercise creation instructions, and
 * modify documents only when explicitly requested.
 */
export const documentEditorAgent = new Agent(components.agent, {
  name: "Document Editor",
  languageModel: gateway("openai/gpt-5.2"),
  instructions: getChatBasePrompt(),
  tools: { loadSkill, editDocument, patchDocument, analyzeImages },
  // Allow the agent to continue after tool calls (up to 10 steps)
  // Without this, the default is stepCountIs(1) which stops immediately
  stopWhen: stepCountIs(10),
});

/**
 * Export skill display text for UI rendering
 */
export { SKILL_DISPLAY_TEXT };

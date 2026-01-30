import { tool } from "ai";
import { z } from "zod";
import { CHAT_SKILL_NAMES } from "./prompts.js";
import { DocumentOperationSchema } from "@package/editor";

export const loadSkill = tool({
  description:
    "Load detailed instructions for creating specific types of exercises. Always use this before creating exercises to ensure correct formatting and guidelines.",
  inputSchema: z.object({
    skill: z
      .enum(CHAT_SKILL_NAMES)
      .describe("The type of exercise skill to load"),
  }),
  execute: async ({
    skill,
  }): Promise<{ success: boolean; instructions: string }> => {
    const instructions = `Instructions for ${skill}: This is a placeholder for evals.`;
    return { success: true, instructions };
  },
});

export const editDocument = tool({
  description:
    "Replace the document content with new XML. Only use for major rewrites when you need to restructure most of the document. For smaller changes, prefer patchDocument instead.",
  inputSchema: z.object({
    documentXml: z
      .string()
      .describe("Complete document XML wrapped in <lesson> tags"),
    summary: z.string().describe("One-sentence summary of the changes made"),
  }),
  execute: async ({
    documentXml,
    summary,
  }): Promise<{
    success: boolean;
    documentXml?: string;
    summary?: string;
    error?: string;
  }> => {
    const trimmed = documentXml.trim();
    if (!trimmed.startsWith("<lesson>") || !trimmed.endsWith("</lesson>")) {
      return {
        success: false,
        error: "Document must be wrapped in <lesson> tags",
      };
    }

    return {
      success: true,
      documentXml: trimmed,
      summary,
    };
  },
});

export const patchDocument = tool({
  description: `Apply surgical edits to the document using semantic operations. Preferred over editDocument for targeted changes.

OPERATIONS:
- insert_after: Insert a new block after the node with the given ID
- insert_before: Insert a new block before the node with the given ID  
- replace_block: Replace an entire block with a new one
- delete_block: Delete the block with the given ID
- set_content: Replace the inline content within a paragraph or heading
- set_attrs: Update attributes of a node (e.g., blank answers, writingArea lines)
- wrap: Wrap multiple blocks in a container (exercise, group, or blockquote)
- unwrap: Remove a wrapper, lifting its content out

BLOCK TYPES: paragraph, heading, bulletList, orderedList, blockquote, horizontalRule, exercise, group, noteBlock, writingArea

INLINE CONTENT: text (with optional marks: bold, italic, underline, strike, code), blank, hardBreak

IMPORTANT: Lists use "items" (not "content"). Each item has a "content" array of blocks.

See source for detailed examples.`,
  inputSchema: z.object({
    operations: z
      .array(DocumentOperationSchema)
      .describe("Array of operations to apply to the document"),
    summary: z
      .string()
      .optional()
      .describe("Brief description of changes made"),
  }),
  execute: async ({
    operations,
    summary,
  }): Promise<{
    success: boolean;
    operationsJson?: string;
    summary?: string;
    error?: string;
  }> => {
    if (operations.length === 0) {
      return {
        success: false,
        error: "At least one operation is required",
      };
    }

    return {
      success: true,
      operationsJson: JSON.stringify(operations),
      summary,
    };
  },
});

export const analyzeImages = tool({
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
  execute: async ({
    storageIds,
    reason,
  }): Promise<{
    success: boolean;
    analysis?: string;
    error?: string;
  }> => {
    return {
      success: true,
      analysis: `Placeholder analysis for ${storageIds.length} images: ${reason}`,
    };
  },
});

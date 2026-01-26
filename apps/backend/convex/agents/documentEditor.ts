import { Agent, createTool } from "@convex-dev/agent";
import {
  DocumentOperationSchema,
  type DocumentOperation,
} from "@package/ai-agent";
import { gateway, stepCountIs } from "ai";
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
  description:
    "Replace the document content with new XML. Only use for major rewrites when you need to restructure most of the document. For smaller changes, prefer patchDocument instead.",
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
 * Tool to apply surgical edits to the document using operations.
 *
 * This is more efficient than editDocument for small changes because
 * it only requires generating the changed parts, not the entire document.
 */
const patchDocument = createTool({
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

=== EXAMPLES FOR EACH OPERATION ===

EXAMPLE - insert_after (add exercise with fill-in-the-blank):
{
  "operations": [{
    "op": "insert_after",
    "id": "p-abc123",
    "block": {
      "type": "exercise",
      "content": [{
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "The capital of France is " },
          { "type": "blank", "correctAnswer": "Paris" },
          { "type": "text", "text": "." }
        ]
      }]
    }
  }],
  "summary": "Added fill-in-the-blank exercise about France"
}

EXAMPLE - insert_before (add instructions before exercise):
{
  "operations": [{
    "op": "insert_before",
    "id": "exercise-xyz",
    "block": {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Complete the following exercise:" }]
    }
  }],
  "summary": "Added instructions before exercise"
}

EXAMPLE - replace_block (replace paragraph with heading):
{
  "operations": [{
    "op": "replace_block",
    "id": "p-old123",
    "block": {
      "type": "heading",
      "level": 2,
      "content": [{ "type": "text", "text": "New Section Title" }]
    }
  }],
  "summary": "Replaced paragraph with heading"
}

EXAMPLE - delete_block (remove a paragraph):
{
  "operations": [{
    "op": "delete_block",
    "id": "p-remove456"
  }],
  "summary": "Removed paragraph"
}

EXAMPLE - set_content (change text in existing paragraph):
{
  "operations": [{
    "op": "set_content",
    "id": "p-def456",
    "content": [
      { "type": "text", "text": "This is the new text with " },
      { "type": "text", "text": "bold words", "marks": ["bold"] },
      { "type": "text", "text": "." }
    ]
  }],
  "summary": "Updated paragraph text with bold formatting"
}

EXAMPLE - set_attrs (update blank answer):
{
  "operations": [{
    "op": "set_attrs",
    "id": "blank-ghi789",
    "attrs": { "correctAnswer": "London", "hint": "Capital of UK" }
  }],
  "summary": "Changed blank answer to London"
}

EXAMPLE - wrap (wrap paragraphs in exercise):
{
  "operations": [{
    "op": "wrap",
    "ids": ["p-abc", "p-def"],
    "wrapper": "exercise"
  }],
  "summary": "Wrapped paragraphs in exercise"
}

EXAMPLE - unwrap (remove exercise wrapper, keep content):
{
  "operations": [{
    "op": "unwrap",
    "id": "exercise-123"
  }],
  "summary": "Removed exercise wrapper, keeping content"
}

EXAMPLE - bulletList (IMPORTANT: use "items", not "content"):
{
  "operations": [{
    "op": "insert_after",
    "id": "p-intro",
    "block": {
      "type": "bulletList",
      "items": [
        { "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "First item" }] }] },
        { "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Second item" }] }] }
      ]
    }
  }],
  "summary": "Added bullet list"
}

EXAMPLE - orderedList (IMPORTANT: use "items", not "content"):
{
  "operations": [{
    "op": "insert_after",
    "id": "p-intro",
    "block": {
      "type": "orderedList",
      "items": [
        { "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Step one" }] }] },
        { "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Step two" }] }] },
        { "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Step three" }] }] }
      ]
    }
  }],
  "summary": "Added numbered steps"
}

EXAMPLE - writingArea (student response area):
{
  "operations": [{
    "op": "insert_after",
    "id": "p-prompt",
    "block": {
      "type": "writingArea",
      "lines": 5,
      "placeholder": "Write your answer here..."
    }
  }],
  "summary": "Added writing area for student response"
}

EXAMPLE - blockquote:
{
  "operations": [{
    "op": "insert_after",
    "id": "p-intro",
    "block": {
      "type": "blockquote",
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "To be or not to be, that is the question." }] }
      ]
    }
  }],
  "summary": "Added Shakespeare quote"
}

EXAMPLE - horizontalRule:
{
  "operations": [{
    "op": "insert_after",
    "id": "exercise-1",
    "block": {
      "type": "horizontalRule"
    }
  }],
  "summary": "Added divider between sections"
}`,
  args: z.object({
    operations: z
      .array(DocumentOperationSchema)
      .describe("Array of operations to apply to the document"),
    summary: z
      .string()
      .optional()
      .describe("Brief description of changes made"),
  }),
  handler: async (
    _ctx,
    { operations, summary },
  ): Promise<{
    success: boolean;
    operations?: DocumentOperation[];
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

    // Return operations for the frontend to apply
    return {
      success: true,
      operations,
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
  tools: { loadSkill, editDocument, patchDocument },
  // Allow the agent to continue after tool calls (up to 10 steps)
  // Without this, the default is stepCountIs(1) which stops immediately
  stopWhen: stepCountIs(10),
});

/**
 * Export skill display text for UI rendering
 */
export { SKILL_DISPLAY_TEXT };

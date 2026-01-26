/**
 * Document Operations Module
 *
 * Provides semantic operations for AI-driven document editing.
 * This module allows surgical edits to Tiptap documents without
 * regenerating the entire document content.
 *
 * @example
 * ```typescript
 * import { applyOperations, DocumentOperationSchema } from "@package/editor";
 *
 * // Validate AI-generated operations
 * const parsed = DocumentOperationsSchema.safeParse(aiResponse.operations);
 * if (parsed.success) {
 *   const results = applyOperations(editor, parsed.data);
 *   const failed = results.filter(r => !r.success);
 *   if (failed.length > 0) {
 *     console.error("Some operations failed:", failed);
 *   }
 * }
 * ```
 */

// Re-export types from @package/ai-agent
export type {
  BlankContent,
  BlockNode,
  BlockquoteNode,
  BulletListNode,
  DeleteBlockOperation,
  DocumentOperation,
  ExerciseNode,
  GroupNode,
  HardBreakContent,
  HeadingNode,
  HorizontalRuleNode,
  InlineContent,
  InsertAfterOperation,
  InsertBeforeOperation,
  ListItem,
  MarkType,
  NoteBlockNode,
  OperationFailure,
  OperationResult,
  OperationSuccess,
  OrderedListNode,
  ParagraphNode,
  ReplaceBlockOperation,
  SetAttrsOperation,
  SetContentOperation,
  TextContent,
  UnwrapOperation,
  WrapOperation,
  WrapperType,
  WritingAreaNode,
} from "@package/ai-agent";

// Re-export Zod schemas from @package/ai-agent
export {
  BlockNodeSchema,
  DocumentOperationSchema,
  DocumentOperationsSchema,
  InlineContentSchema,
  MarkTypeSchema,
  WrapperTypeSchema,
} from "@package/ai-agent";

// Executor (stays here - has Tiptap dependencies)
export { applyOperations, applySingleOperation } from "./executor";

// ID resolver (useful for testing/debugging)
export { findNodeById, findNodesByIds, nodeExistsById } from "./id-resolver";

// Node builder (useful for testing/debugging)
export { blockNodeToJSON, inlineContentToJSON } from "./node-builder";

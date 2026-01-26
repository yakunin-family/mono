/**
 * AI Agent Package
 *
 * Shared types and Zod schemas for AI agent document operations.
 * Used by both the editor package (frontend) and backend.
 */

// Types
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
} from "./types";

// Zod schemas
export {
  BlankContentSchema,
  BlockNodeSchema,
  DeleteBlockOperationSchema,
  DocumentOperationSchema,
  DocumentOperationsSchema,
  HardBreakContentSchema,
  InlineContentSchema,
  InsertAfterOperationSchema,
  InsertBeforeOperationSchema,
  ListItemSchema,
  MarkTypeSchema,
  ReplaceBlockOperationSchema,
  SetAttrsOperationSchema,
  SetContentOperationSchema,
  TextContentSchema,
  UnwrapOperationSchema,
  WrapOperationSchema,
  WrapperTypeSchema,
} from "./schema";

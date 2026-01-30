/**
 * Semantic Document Operations
 *
 * Type definitions for AI-driven document editing operations.
 * These operations allow surgical edits to Tiptap documents without
 * regenerating the entire document content.
 */

// =============================================================================
// Mark Types
// =============================================================================

export type MarkType = "bold" | "italic" | "underline" | "strike" | "code";

// =============================================================================
// Inline Content
// =============================================================================

export interface TextContent {
  type: "text";
  text: string;
  marks?: MarkType[];
}

export interface BlankContent {
  type: "blank";
  correctAnswer: string;
  alternativeAnswers?: string[];
  hint?: string;
}

export interface HardBreakContent {
  type: "hardBreak";
}

export type InlineContent = TextContent | BlankContent | HardBreakContent;

// =============================================================================
// List Items
// =============================================================================

export interface ListItem {
  content: BlockNode[];
}

// =============================================================================
// Block Nodes
// =============================================================================

export interface ParagraphNode {
  type: "paragraph";
  content?: InlineContent[];
}

export interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3;
  content?: InlineContent[];
}

export interface BulletListNode {
  type: "bulletList";
  items: ListItem[];
}

export interface OrderedListNode {
  type: "orderedList";
  items: ListItem[];
}

export interface BlockquoteNode {
  type: "blockquote";
  content: BlockNode[];
}

export interface HorizontalRuleNode {
  type: "horizontalRule";
}

export interface ExerciseNode {
  type: "exercise";
  content: BlockNode[];
}

export interface GroupNode {
  type: "group";
  content: BlockNode[];
}

export interface NoteBlockNode {
  type: "noteBlock";
  content: BlockNode[];
}

export interface WritingAreaNode {
  type: "writingArea";
  lines?: number;
  placeholder?: string;
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | BlockquoteNode
  | HorizontalRuleNode
  | ExerciseNode
  | GroupNode
  | NoteBlockNode
  | WritingAreaNode;

// =============================================================================
// Wrapper Types (for wrap operation)
// =============================================================================

export type WrapperType = "exercise" | "group" | "blockquote";

// =============================================================================
// Operations
// =============================================================================

/**
 * Insert a new block after the node with the given ID
 */
export interface InsertAfterOperation {
  op: "insert_after";
  id: string;
  block: BlockNode;
}

/**
 * Insert a new block before the node with the given ID
 */
export interface InsertBeforeOperation {
  op: "insert_before";
  id: string;
  block: BlockNode;
}

/**
 * Replace an entire block with a new one
 */
export interface ReplaceBlockOperation {
  op: "replace_block";
  id: string;
  block: BlockNode;
}

/**
 * Delete the block with the given ID
 */
export interface DeleteBlockOperation {
  op: "delete_block";
  id: string;
}

/**
 * Replace the inline content within a paragraph or heading
 */
export interface SetContentOperation {
  op: "set_content";
  id: string;
  content: InlineContent[];
}

/**
 * Update attributes of a node (e.g., blank answer, writingArea lines)
 */
export interface SetAttrsOperation {
  op: "set_attrs";
  id: string;
  attrs: Record<string, unknown>;
}

/**
 * Wrap multiple blocks in a container (exercise, group, or blockquote)
 */
export interface WrapOperation {
  op: "wrap";
  ids: string[];
  wrapper: WrapperType;
}

/**
 * Unwrap a container, lifting its content out
 */
export interface UnwrapOperation {
  op: "unwrap";
  id: string;
}

export type DocumentOperation =
  | InsertAfterOperation
  | InsertBeforeOperation
  | ReplaceBlockOperation
  | DeleteBlockOperation
  | SetContentOperation
  | SetAttrsOperation
  | WrapOperation
  | UnwrapOperation;

// =============================================================================
// Operation Results
// =============================================================================

export interface OperationSuccess {
  success: true;
  op: DocumentOperation;
}

export interface OperationFailure {
  success: false;
  op: DocumentOperation;
  error: string;
}

export type OperationResult = OperationSuccess | OperationFailure;

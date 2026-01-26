/**
 * Operation Executor
 *
 * Applies document operations to a Tiptap editor instance.
 * Each operation is applied independently with partial success semantics.
 */

import type { Editor } from "@tiptap/core";
import { Fragment } from "@tiptap/pm/model";

import { findNodeById, findNodesByIds } from "./id-resolver";
import { blockNodeToJSON, inlineContentToJSON } from "./node-builder";
import type {
  BlockNode,
  DocumentOperation,
  InlineContent,
  OperationResult,
  WrapperType,
} from "@package/ai-agent";

/**
 * Error thrown when a node with the specified ID is not found
 */
class NodeNotFoundError extends Error {
  constructor(id: string) {
    super(`Node with id '${id}' not found`);
    this.name = "NodeNotFoundError";
  }
}

/**
 * Apply a single insert_after operation
 */
function executeInsertAfter(
  editor: Editor,
  id: string,
  block: BlockNode,
): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;
  const insertPos = pos + node.nodeSize;
  const jsonContent = blockNodeToJSON(block);

  editor.chain().focus().insertContentAt(insertPos, jsonContent).run();
}

/**
 * Apply a single insert_before operation
 */
function executeInsertBefore(
  editor: Editor,
  id: string,
  block: BlockNode,
): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos } = resolved;
  const jsonContent = blockNodeToJSON(block);

  editor.chain().focus().insertContentAt(pos, jsonContent).run();
}

/**
 * Apply a single replace_block operation
 */
function executeReplaceBlock(
  editor: Editor,
  id: string,
  block: BlockNode,
): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;
  const jsonContent = blockNodeToJSON(block);

  editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + node.nodeSize })
    .insertContentAt(pos, jsonContent)
    .run();
}

/**
 * Apply a single delete_block operation
 */
function executeDeleteBlock(editor: Editor, id: string): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;

  editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + node.nodeSize })
    .run();
}

/**
 * Apply a single set_content operation
 */
function executeSetContent(
  editor: Editor,
  id: string,
  content: InlineContent[],
): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;

  // Only works on nodes that can have inline content (paragraph, heading)
  if (!node.type.spec.content?.includes("inline")) {
    throw new Error(
      `Node type '${node.type.name}' does not support inline content`,
    );
  }

  const jsonContent = inlineContentToJSON(content);

  // Replace the content inside the node
  const from = pos + 1; // Start of content
  const to = pos + node.nodeSize - 1; // End of content

  editor
    .chain()
    .focus()
    .deleteRange({ from, to })
    .insertContentAt(from, jsonContent)
    .run();
}

/**
 * Apply a single set_attrs operation
 */
function executeSetAttrs(
  editor: Editor,
  id: string,
  attrs: Record<string, unknown>,
): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;

  // Merge new attrs with existing ones
  const newAttrs = { ...node.attrs, ...attrs };

  editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, newAttrs));
}

/**
 * Apply a single wrap operation
 */
function executeWrap(
  editor: Editor,
  ids: string[],
  wrapper: WrapperType,
): void {
  if (ids.length === 0) {
    throw new Error("wrap operation requires at least one id");
  }

  const resolvedNodes = findNodesByIds(editor.state.doc, ids);

  if (resolvedNodes.length !== ids.length) {
    const foundIds = resolvedNodes.map((r) => r.node.attrs.id);
    const missingIds = ids.filter((id) => !foundIds.includes(id));
    throw new Error(`Nodes not found: ${missingIds.join(", ")}`);
  }

  // Get the range to wrap
  const startPos = resolvedNodes[0]!.pos;
  const lastNode = resolvedNodes[resolvedNodes.length - 1]!;
  const endPos = lastNode.pos + lastNode.node.nodeSize;

  // Collect all nodes in the range
  const nodesToWrap = resolvedNodes.map((r) => r.node);

  // Get the wrapper node type from schema
  const wrapperType = editor.schema.nodes[wrapper];
  if (!wrapperType) {
    throw new Error(`Unknown wrapper type: ${wrapper}`);
  }

  // Create the wrapper node with collected content
  const wrapperNode = wrapperType.create(
    {}, // attrs - UniqueID will generate id
    Fragment.from(nodesToWrap),
  );

  // Replace the range with the wrapped content
  const { tr } = editor.state;
  tr.replaceWith(startPos, endPos, wrapperNode);
  editor.view.dispatch(tr);
}

/**
 * Apply a single unwrap operation
 */
function executeUnwrap(editor: Editor, id: string): void {
  const resolved = findNodeById(editor.state.doc, id);
  if (!resolved) {
    throw new NodeNotFoundError(id);
  }

  const { pos, node } = resolved;

  // Check if the node can be unwrapped (has content)
  if (!node.content || node.content.size === 0) {
    throw new Error(`Node '${id}' has no content to unwrap`);
  }

  // Replace the wrapper with its content
  const { tr } = editor.state;
  tr.replaceWith(pos, pos + node.nodeSize, node.content);
  editor.view.dispatch(tr);
}

/**
 * Apply a single operation to the editor
 *
 * @throws Error if the operation fails
 */
function applyOperation(editor: Editor, op: DocumentOperation): void {
  switch (op.op) {
    case "insert_after":
      executeInsertAfter(editor, op.id, op.block);
      break;

    case "insert_before":
      executeInsertBefore(editor, op.id, op.block);
      break;

    case "replace_block":
      executeReplaceBlock(editor, op.id, op.block);
      break;

    case "delete_block":
      executeDeleteBlock(editor, op.id);
      break;

    case "set_content":
      executeSetContent(editor, op.id, op.content);
      break;

    case "set_attrs":
      executeSetAttrs(editor, op.id, op.attrs);
      break;

    case "wrap":
      executeWrap(editor, op.ids, op.wrapper);
      break;

    case "unwrap":
      executeUnwrap(editor, op.id);
      break;

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = op;
      throw new Error(
        `Unknown operation: ${(_exhaustive as DocumentOperation).op}`,
      );
    }
  }
}

/**
 * Apply multiple operations to the editor.
 *
 * Operations are applied sequentially. If an operation fails,
 * it is recorded in the results and execution continues with
 * the next operation (partial success semantics).
 *
 * @param editor - The Tiptap editor instance
 * @param operations - Array of operations to apply
 * @returns Array of results, one per operation
 */
export function applyOperations(
  editor: Editor,
  operations: DocumentOperation[],
): OperationResult[] {
  const results: OperationResult[] = [];

  for (const op of operations) {
    try {
      applyOperation(editor, op);
      results.push({ success: true, op });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.push({ success: false, op, error: errorMessage });
    }
  }

  return results;
}

/**
 * Apply a single operation to the editor.
 *
 * @param editor - The Tiptap editor instance
 * @param operation - The operation to apply
 * @returns Result indicating success or failure
 */
export function applySingleOperation(
  editor: Editor,
  operation: DocumentOperation,
): OperationResult {
  return applyOperations(editor, [operation])[0]!;
}

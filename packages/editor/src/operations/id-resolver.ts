/**
 * ID Resolver
 *
 * Utilities for finding ProseMirror nodes by their unique ID attribute.
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface ResolvedNode {
  node: ProseMirrorNode;
  pos: number;
}

/**
 * Find a node in the document by its ID attribute.
 *
 * @param doc - The ProseMirror document to search
 * @param id - The ID to find
 * @returns The node and its position, or null if not found
 */
export function findNodeById(
  doc: ProseMirrorNode,
  id: string,
): ResolvedNode | null {
  let result: ResolvedNode | null = null;

  doc.descendants((node, pos) => {
    // Stop traversing if we already found it
    if (result) return false;

    // Check if this node has the matching ID
    if (node.attrs.id === id) {
      result = { node, pos };
      return false; // Stop traversing
    }

    return true; // Continue traversing
  });

  return result;
}

/**
 * Find multiple nodes by their IDs.
 * Returns nodes in the order of their positions in the document.
 *
 * @param doc - The ProseMirror document to search
 * @param ids - Array of IDs to find
 * @returns Array of resolved nodes (may be fewer than ids if some not found)
 */
export function findNodesByIds(
  doc: ProseMirrorNode,
  ids: string[],
): ResolvedNode[] {
  const idSet = new Set(ids);
  const results: ResolvedNode[] = [];

  doc.descendants((node, pos) => {
    if (node.attrs.id && idSet.has(node.attrs.id)) {
      results.push({ node, pos });
    }
    return true; // Continue traversing to find all
  });

  // Sort by position to ensure document order
  results.sort((a, b) => a.pos - b.pos);

  return results;
}

/**
 * Check if a node exists with the given ID.
 *
 * @param doc - The ProseMirror document to search
 * @param id - The ID to check
 * @returns true if a node with this ID exists
 */
export function nodeExistsById(doc: ProseMirrorNode, id: string): boolean {
  return findNodeById(doc, id) !== null;
}

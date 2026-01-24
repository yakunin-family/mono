import type { JSONContent } from "@tiptap/core";

/**
 * Serialize a noteBlock node to XML
 */
export function serializeNote(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const content = serializeChildren(node.content || []);
  return `<note>${content}</note>`;
}

/**
 * Parse a note element to Tiptap JSON
 */
export function parseNote(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  return {
    type: "noteBlock",
    content: parseChildren(element),
  };
}

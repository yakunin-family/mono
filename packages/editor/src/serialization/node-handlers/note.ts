import type { JSONContent } from "@tiptap/core";

import { escapeXml } from "./blocks";

/**
 * Serialize a noteBlock node to XML
 */
export function serializeNote(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const attrs = node.attrs || {};
  const idAttr = attrs.id ? ` id="${escapeXml(attrs.id)}"` : "";
  const content = serializeChildren(node.content || []);
  return `<note${idAttr}>${content}</note>`;
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

import type { JSONContent } from "@tiptap/core";

import { escapeXml } from "./blocks";

/**
 * Serialize a group node to XML
 */
export function serializeGroup(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const attrs = node.attrs || {};
  const parts: string[] = ["group"];

  // Include id if present
  if (attrs.id) {
    parts.push(`id="${escapeXml(attrs.id)}"`);
  }

  const openTag = `<${parts.join(" ")}>`;
  const content = serializeChildren(node.content || []);
  const closeTag = "</group>";

  return `${openTag}${content}${closeTag}`;
}

/**
 * Parse a group element to Tiptap JSON
 */
export function parseGroup(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const id = element.getAttribute("id");

  return {
    type: "group",
    attrs: {
      id: id || null,
    },
    content: parseChildren(element),
  };
}

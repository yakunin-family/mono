import type { JSONContent } from "@tiptap/core";

import { escapeXml } from "./blocks";

/**
 * Serialize a writingArea node to XML
 */
export function serializeWritingArea(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const attrs = node.attrs || {};
  const parts: string[] = ["writing-area"];

  // Include id if present
  if (attrs.id) {
    parts.push(`id="${escapeXml(attrs.id)}"`);
  }

  // Include lines (default is 5)
  const lines = attrs.lines ?? 5;
  parts.push(`lines="${lines}"`);

  // Include placeholder if present
  if (attrs.placeholder) {
    parts.push(`placeholder="${escapeXml(attrs.placeholder)}"`);
  }

  const openTag = `<${parts.join(" ")}>`;
  const content = serializeChildren(node.content || []);
  const closeTag = "</writing-area>";

  return `${openTag}${content}${closeTag}`;
}

/**
 * Parse a writing-area element to Tiptap JSON
 */
export function parseWritingArea(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const id = element.getAttribute("id");
  const linesStr = element.getAttribute("lines");
  const placeholder = element.getAttribute("placeholder");

  return {
    type: "writingArea",
    attrs: {
      id: id || "",
      lines: linesStr ? parseInt(linesStr, 10) : 5,
      placeholder: placeholder || "Write your answer here...",
    },
    content: parseChildren(element),
  };
}

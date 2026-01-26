import type { JSONContent } from "@tiptap/core";

import { escapeXml } from "./blocks";

/**
 * Extract text content from paragraphs for student response
 */
function extractTextContent(content: JSONContent[] | undefined): string {
  if (!content) return "";

  return content
    .map((node) => {
      if (node.type === "paragraph" && node.content) {
        return node.content
          .map((inline) => {
            if (inline.type === "text") {
              return inline.text || "";
            }
            if (inline.type === "hardBreak") {
              return "\n";
            }
            return "";
          })
          .join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Serialize a writingArea node to XML
 *
 * For AI context, the student's written response is included as a
 * `student-response` attribute, abstracting away the internal paragraph
 * structure. The AI should not modify this content.
 */
export function serializeWritingArea(
  node: JSONContent,
  _serializeChildren: (children: JSONContent[]) => string,
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

  // Extract student's written response from internal paragraphs
  const studentResponse = extractTextContent(node.content);
  if (studentResponse) {
    parts.push(`student-response="${escapeXml(studentResponse)}"`);
  }

  // WritingArea is serialized as a self-closing tag for AI
  // The internal paragraph structure is abstracted away
  return `<${parts.join(" ")} />`;
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

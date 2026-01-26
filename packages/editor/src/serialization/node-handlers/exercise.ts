import type { JSONContent } from "@tiptap/core";

import { escapeXml } from "./blocks";

/**
 * Serialize a blank node to XML
 */
export function serializeBlank(
  node: JSONContent,
  _serializeChildren: (children: JSONContent[]) => string,
): string {
  const attrs = node.attrs || {};
  const parts: string[] = ["blank"];

  // Include id if present
  if (attrs.id) {
    parts.push(`id="${escapeXml(attrs.id)}"`);
  }

  // Required: answer
  const answer = attrs.correctAnswer || "";
  parts.push(`answer="${escapeXml(answer)}"`);

  // Optional: alts (only if non-empty)
  const alts = attrs.alternativeAnswers || [];
  if (Array.isArray(alts) && alts.length > 0) {
    parts.push(`alts="${escapeXml(alts.join(","))}"`);
  }

  // Optional: hint (only if present)
  if (attrs.hint) {
    parts.push(`hint="${escapeXml(attrs.hint)}"`);
  }

  // Student answer (always include, may be empty)
  const studentAnswer = attrs.studentAnswer || "";
  parts.push(`student-answer="${escapeXml(studentAnswer)}"`);

  return `<${parts.join(" ")} />`;
}

/**
 * Serialize an exercise node to XML
 */
export function serializeExercise(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const attrs = node.attrs || {};
  const parts: string[] = ["exercise"];

  // Include id if present
  if (attrs.id) {
    parts.push(`id="${escapeXml(attrs.id)}"`);
  }

  // Note: index is auto-calculated, not serialized

  const openTag = `<${parts.join(" ")}>`;
  const content = serializeChildren(node.content || []);
  const closeTag = "</exercise>";

  return `${openTag}${content}${closeTag}`;
}

/**
 * Parse a blank element to Tiptap JSON
 */
export function parseBlank(
  element: Element,
  _parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const answer = element.getAttribute("answer") || "";
  const altsStr = element.getAttribute("alts");
  const hint = element.getAttribute("hint");
  const studentAnswer = element.getAttribute("student-answer") || "";

  return {
    type: "blank",
    attrs: {
      correctAnswer: answer,
      alternativeAnswers: altsStr
        ? altsStr.split(",").map((s) => s.trim())
        : [],
      hint: hint || null,
      studentAnswer,
    },
  };
}

/**
 * Parse an exercise element to Tiptap JSON
 */
export function parseExercise(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const id = element.getAttribute("id");

  return {
    type: "exercise",
    attrs: {
      id: id || null,
      // index will be auto-calculated by Tiptap
    },
    content: parseChildren(element),
  };
}

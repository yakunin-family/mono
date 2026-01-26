import type { JSONContent } from "@tiptap/core";

import { MARK_TO_TAG, TAG_TO_MARK, TAG_TO_NODE } from "../types";

/**
 * Escape special XML characters in text content
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Unescape XML entities back to characters
 */
export function unescapeXml(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

/**
 * Serialize inline content (text with marks) to XML
 */
export function serializeInlineContent(
  content: JSONContent[] | undefined,
): string {
  if (!content) return "";

  return content
    .map((node) => {
      if (node.type === "text") {
        let text = escapeXml(node.text || "");

        // Wrap with mark tags (innermost first, so we build from inside out)
        if (node.marks) {
          // Reverse to apply marks from inside out
          const marks = [...node.marks].reverse();
          for (const mark of marks) {
            const tag = MARK_TO_TAG[mark.type];
            if (tag) {
              text = `<${tag}>${text}</${tag}>`;
            }
          }
        }

        return text;
      }

      if (node.type === "hardBreak") {
        return "<br />";
      }

      // For inline nodes like blank, delegate to specific handler
      // This will be handled by the main serializer
      return `{{INLINE:${JSON.stringify(node)}}}`;
    })
    .join("");
}

/**
 * Helper to generate id attribute string if present
 */
function idAttr(node: JSONContent): string {
  return node.attrs?.id ? ` id="${escapeXml(node.attrs.id)}"` : "";
}

/**
 * Serialize a heading node to XML
 */
export function serializeHeading(
  node: JSONContent,
  _serializeChildren: (children: JSONContent[]) => string,
): string {
  const level = Math.min(Math.max(node.attrs?.level || 1, 1), 3); // Clamp to 1-3
  const content = serializeInlineContent(node.content);
  return `<h${level}${idAttr(node)}>${content}</h${level}>`;
}

/**
 * Serialize a paragraph node to XML
 */
export function serializeParagraph(
  node: JSONContent,
  _serializeChildren: (children: JSONContent[]) => string,
): string {
  const content = serializeInlineContent(node.content);
  return `<p${idAttr(node)}>${content}</p>`;
}

/**
 * Serialize a bullet list to XML
 */
export function serializeBulletList(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const content = serializeChildren(node.content || []);
  return `<ul${idAttr(node)}>${content}</ul>`;
}

/**
 * Serialize an ordered list to XML
 */
export function serializeOrderedList(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const start = node.attrs?.start;
  const startAttr = start && start !== 1 ? ` start="${start}"` : "";
  const content = serializeChildren(node.content || []);
  return `<ol${idAttr(node)}${startAttr}>${content}</ol>`;
}

/**
 * Serialize a list item to XML
 */
export function serializeListItem(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const content = serializeChildren(node.content || []);
  return `<li${idAttr(node)}>${content}</li>`;
}

/**
 * Serialize a blockquote to XML
 */
export function serializeBlockquote(
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
): string {
  const content = serializeChildren(node.content || []);
  return `<blockquote${idAttr(node)}>${content}</blockquote>`;
}

/**
 * Serialize a horizontal rule to XML
 */
export function serializeHorizontalRule(
  node: JSONContent,
  _serializeChildren: (children: JSONContent[]) => string,
): string {
  return `<hr${idAttr(node)} />`;
}

/**
 * Parse inline content from an element, handling text and marks
 */
export function parseInlineContent(element: Element): JSONContent[] {
  const result: JSONContent[] = [];

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) {
        result.push({ type: "text", text: unescapeXml(text) });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      // Check if it's a mark tag
      const markType = TAG_TO_MARK[tagName];
      if (markType) {
        // Recursively parse content and add mark to all text nodes
        const innerContent = parseInlineContent(el);
        for (const innerNode of innerContent) {
          if (innerNode.type === "text") {
            innerNode.marks = innerNode.marks || [];
            innerNode.marks.push({ type: markType });
          }
          result.push(innerNode);
        }
      } else if (tagName === "br") {
        result.push({ type: "hardBreak" });
      } else if (tagName === "blank") {
        // Handle blank inline - this will be processed by parseBlank
        result.push({
          type: "blank",
          attrs: parseBlankAttributes(el),
        });
      }
    }
  }

  return result;
}

/**
 * Parse blank attributes from element
 */
function parseBlankAttributes(el: Element): Record<string, unknown> {
  const answer = el.getAttribute("answer") || "";
  const altsStr = el.getAttribute("alts");
  const hint = el.getAttribute("hint");
  const studentAnswer = el.getAttribute("student-answer") || "";

  return {
    correctAnswer: answer,
    alternativeAnswers: altsStr ? altsStr.split(",").map((s) => s.trim()) : [],
    hint: hint || null,
    studentAnswer,
  };
}

/**
 * Parse a heading element to Tiptap JSON
 */
export function parseHeading(
  element: Element,
  _parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const tagName = element.tagName.toLowerCase();
  const level = parseInt(tagName.substring(1), 10);

  return {
    type: "heading",
    attrs: { level: Math.min(Math.max(level, 1), 3) },
    content: parseInlineContent(element),
  };
}

/**
 * Parse a paragraph element to Tiptap JSON
 */
export function parseParagraph(
  element: Element,
  _parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  return {
    type: "paragraph",
    content: parseInlineContent(element),
  };
}

/**
 * Parse a bullet list element to Tiptap JSON
 */
export function parseBulletList(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  return {
    type: "bulletList",
    content: parseChildren(element),
  };
}

/**
 * Parse an ordered list element to Tiptap JSON
 */
export function parseOrderedList(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  const start = element.getAttribute("start");
  return {
    type: "orderedList",
    attrs: start ? { start: parseInt(start, 10) } : undefined,
    content: parseChildren(element),
  };
}

/**
 * Parse a list item element to Tiptap JSON
 */
export function parseListItem(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  // List items can contain block content or inline content
  // Check if there are block-level children
  const hasBlockChildren = Array.from(element.children).some((child) => {
    const tag = child.tagName.toLowerCase();
    return (
      TAG_TO_NODE[tag] &&
      !["b", "i", "u", "s", "code", "br", "blank"].includes(tag)
    );
  });

  if (hasBlockChildren) {
    return {
      type: "listItem",
      content: parseChildren(element),
    };
  } else {
    // Wrap inline content in a paragraph
    return {
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: parseInlineContent(element),
        },
      ],
    };
  }
}

/**
 * Parse a blockquote element to Tiptap JSON
 */
export function parseBlockquote(
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  return {
    type: "blockquote",
    content: parseChildren(element),
  };
}

/**
 * Parse a horizontal rule element to Tiptap JSON
 */
export function parseHorizontalRule(
  _element: Element,
  _parseChildren: (element: Element) => JSONContent[],
): JSONContent {
  return {
    type: "horizontalRule",
  };
}

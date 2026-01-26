import type { Editor, JSONContent } from "@tiptap/core";

import type { NodeSerializer, ToXMLOptions } from "./types";
import { EXCLUDED_NODES } from "./types";
import {
  serializeHeading,
  serializeParagraph,
  serializeBulletList,
  serializeOrderedList,
  serializeListItem,
  serializeBlockquote,
  serializeHorizontalRule,
  serializeInlineContent,
} from "./node-handlers/blocks";
import { serializeBlank, serializeExercise } from "./node-handlers/exercise";
import { serializeNote } from "./node-handlers/note";
import { serializeWritingArea } from "./node-handlers/writing-area";
import { serializeGroup } from "./node-handlers/group";

/**
 * Registry of node serializers by Tiptap node type
 */
const nodeSerializers: Record<string, NodeSerializer> = {
  heading: serializeHeading,
  paragraph: serializeParagraph,
  bulletList: serializeBulletList,
  orderedList: serializeOrderedList,
  listItem: serializeListItem,
  blockquote: serializeBlockquote,
  horizontalRule: serializeHorizontalRule,
  exercise: serializeExercise,
  blank: serializeBlank,
  noteBlock: serializeNote,
  writingArea: serializeWritingArea,
  group: serializeGroup,
};

/**
 * Serialize a single node to XML
 */
function serializeNode(
  node: JSONContent,
  options: ToXMLOptions,
  depth: number,
): string {
  const indent = options.pretty ? options.indent || "  " : "";
  const newline = options.pretty ? "\n" : "";
  const currentIndent = options.pretty ? indent.repeat(depth) : "";

  // Helper to serialize children with proper indentation
  const serializeChildren = (children: JSONContent[]): string => {
    if (!children || children.length === 0) return "";

    const childResults = children
      .map((child) => serializeNode(child, options, depth + 1))
      .filter((s) => s !== "");

    if (options.pretty && childResults.length > 0) {
      return newline + childResults.join(newline) + newline + currentIndent;
    }
    return childResults.join("");
  };

  // Skip excluded nodes
  if (EXCLUDED_NODES.includes(node.type as (typeof EXCLUDED_NODES)[number])) {
    return "";
  }

  // Handle special cases
  if (node.type === "doc") {
    // Document root - serialize children without wrapper
    return (node.content || [])
      .map((child) => serializeNode(child, options, depth))
      .filter((s) => s !== "")
      .join(newline);
  }

  if (node.type === "paragraph") {
    // Paragraphs need special handling for inline blanks
    return currentIndent + serializeParagraphWithBlanks(node);
  }

  if (node.type === "text") {
    // Text nodes are handled inline, shouldn't reach here at block level
    return "";
  }

  if (node.type === "hardBreak") {
    return "<br />";
  }

  // Use registry for known node types
  const serializer = node.type ? nodeSerializers[node.type] : undefined;
  if (serializer) {
    return currentIndent + serializer(node, serializeChildren);
  }

  // Unknown node type - skip with warning in development
  console.warn(`Unknown node type: ${node.type}`);
  return "";
}

/**
 * Escape special XML characters in text content
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Serialize a paragraph, handling inline blank nodes
 */
function serializeParagraphWithBlanks(node: JSONContent): string {
  const attrs = node.attrs || {};
  const idAttr = attrs.id ? ` id="${escapeXml(attrs.id)}"` : "";

  if (!node.content) {
    return `<p${idAttr}></p>`;
  }

  // Process inline content, replacing blank nodes with their XML
  const content = node.content
    .map((child) => {
      if (child.type === "blank") {
        return serializeBlank(child, () => "");
      }
      if (child.type === "hardBreak") {
        return "<br />";
      }
      // Regular text/marks
      return serializeInlineContent([child]);
    })
    .join("");

  return `<p${idAttr}>${content}</p>`;
}

/**
 * Convert editor content to XML string
 */
export function toXML(editor: Editor, options: ToXMLOptions = {}): string {
  const opts: ToXMLOptions = {
    pretty: options.pretty ?? true,
    indent: options.indent ?? "  ",
  };

  const json = editor.getJSON();
  const newline = opts.pretty ? "\n" : "";

  // Serialize document content
  const content = (json.content || [])
    .map((child) => serializeNode(child, opts, 1))
    .filter((s) => s !== "")
    .join(newline);

  // Wrap in lesson root element
  if (opts.pretty) {
    return `<lesson>\n${content}\n</lesson>`;
  }
  return `<lesson>${content}</lesson>`;
}

/**
 * Convert Tiptap JSON content to XML string (without Editor instance)
 * Useful for testing or when you have JSON directly
 */
export function jsonToXML(
  json: JSONContent,
  options: ToXMLOptions = {},
): string {
  const opts: ToXMLOptions = {
    pretty: options.pretty ?? true,
    indent: options.indent ?? "  ",
  };

  const newline = opts.pretty ? "\n" : "";

  // Handle doc wrapper or raw content
  const content = json.type === "doc" ? json.content : [json];

  const serialized = (content || [])
    .map((child) => serializeNode(child, opts, 1))
    .filter((s) => s !== "")
    .join(newline);

  if (opts.pretty) {
    return `<lesson>\n${serialized}\n</lesson>`;
  }
  return `<lesson>${serialized}</lesson>`;
}

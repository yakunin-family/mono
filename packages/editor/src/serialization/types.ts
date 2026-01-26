import type { JSONContent } from "@tiptap/core";

/**
 * Options for toXML serialization
 */
export interface ToXMLOptions {
  /** Add indentation and newlines (default: true) */
  pretty?: boolean;
  /** Indentation string (default: "  ") */
  indent?: string;
}

/**
 * Options for fromXML parsing
 */
export interface FromXMLOptions {
  /** Replace entire document content (default: true) */
  replace?: boolean;
}

/**
 * Result of XML validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Supported block element tag names
 */
export const BLOCK_TAGS = [
  "h1",
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
] as const;

export type BlockTag = (typeof BLOCK_TAGS)[number];

/**
 * Supported inline mark tag names
 */
export const MARK_TAGS = ["b", "i", "u", "s", "code"] as const;

export type MarkTag = (typeof MARK_TAGS)[number];

/**
 * Custom building block tag names
 */
export const CUSTOM_TAGS = [
  "exercise",
  "blank",
  "note",
  "writing-area",
  "group",
] as const;

export type CustomTag = (typeof CUSTOM_TAGS)[number];

/**
 * All supported tag names
 */
export const ALL_TAGS = [
  ...BLOCK_TAGS,
  ...MARK_TAGS,
  ...CUSTOM_TAGS,
  "br",
  "lesson",
] as const;

export type AllTag = (typeof ALL_TAGS)[number];

/**
 * Map from XML tag to Tiptap node type
 */
export const TAG_TO_NODE: Record<string, string> = {
  // Block elements
  h1: "heading",
  h2: "heading",
  h3: "heading",
  p: "paragraph",
  ul: "bulletList",
  ol: "orderedList",
  li: "listItem",
  blockquote: "blockquote",
  hr: "horizontalRule",
  br: "hardBreak",
  // Custom building blocks
  exercise: "exercise",
  blank: "blank",
  note: "noteBlock",
  "writing-area": "writingArea",
  group: "group",
};

/**
 * Map from Tiptap node type to XML tag
 */
export const NODE_TO_TAG: Record<string, string> = {
  // Block elements
  heading: "h", // Will append level (h1, h2, h3)
  paragraph: "p",
  bulletList: "ul",
  orderedList: "ol",
  listItem: "li",
  blockquote: "blockquote",
  horizontalRule: "hr",
  hardBreak: "br",
  // Custom building blocks
  exercise: "exercise",
  blank: "blank",
  noteBlock: "note",
  writingArea: "writing-area",
  group: "group",
};

/**
 * Map from Tiptap mark type to XML tag
 */
export const MARK_TO_TAG: Record<string, string> = {
  bold: "b",
  italic: "i",
  underline: "u",
  strike: "s",
  code: "code",
};

/**
 * Map from XML tag to Tiptap mark type
 */
export const TAG_TO_MARK: Record<string, string> = {
  b: "bold",
  i: "italic",
  u: "underline",
  s: "strike",
  code: "code",
};

/**
 * Nodes that should be excluded from serialization
 */
export const EXCLUDED_NODES = [
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "image",
] as const;

/**
 * Handler function type for serializing a node to XML
 */
export type NodeSerializer = (
  node: JSONContent,
  serializeChildren: (children: JSONContent[]) => string,
) => string;

/**
 * Handler function type for parsing an XML element to Tiptap JSON
 */
export type NodeParser = (
  element: Element,
  parseChildren: (element: Element) => JSONContent[],
) => JSONContent | null;

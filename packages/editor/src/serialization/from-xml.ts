import type { Editor, JSONContent } from "@tiptap/core";

import {
  parseBlockquote,
  parseBulletList,
  parseHeading,
  parseHorizontalRule,
  parseInlineContent,
  parseListItem,
  parseOrderedList,
  parseParagraph,
} from "./node-handlers/blocks";
import { parseBlank, parseExercise } from "./node-handlers/exercise";
import { parseGroup } from "./node-handlers/group";
import { parseNote } from "./node-handlers/note";
import { parseWritingArea } from "./node-handlers/writing-area";
import type { FromXMLOptions } from "./types";
import { ALL_TAGS, TAG_TO_MARK } from "./types";

/**
 * Parse an XML element to Tiptap JSON content
 */
function parseElement(element: Element): JSONContent | null {
  const tagName = element.tagName.toLowerCase();

  // Recursive child parser
  const parseChildren = (el: Element): JSONContent[] => {
    const children: JSONContent[] = [];

    for (const child of Array.from(el.children)) {
      const parsed = parseElement(child);
      if (parsed) {
        children.push(parsed);
      }
    }

    return children;
  };

  switch (tagName) {
    case "lesson":
      // Root element - return document structure
      return {
        type: "doc",
        content: parseChildren(element),
      };

    case "h1":
    case "h2":
    case "h3":
      return parseHeading(element, parseChildren);

    case "p":
      return parseParagraphWithBlanks(element);

    case "ul":
      return parseBulletList(element, parseChildren);

    case "ol":
      return parseOrderedList(element, parseChildren);

    case "li":
      return parseListItem(element, parseChildren);

    case "blockquote":
      return parseBlockquote(element, parseChildren);

    case "hr":
      return parseHorizontalRule(element, parseChildren);

    case "exercise":
      return parseExercise(element, parseChildren);

    case "blank":
      return parseBlank(element, parseChildren);

    case "note":
      return parseNote(element, parseChildren);

    case "writing-area":
      return parseWritingArea(element, parseChildren);

    case "group":
      return parseGroup(element, parseChildren);

    default:
      // Unknown tag - throw error for strict mode
      throw new Error(`Unknown XML tag: <${tagName}>`);
  }
}

/**
 * Parse a paragraph element, handling inline blanks
 */
function parseParagraphWithBlanks(element: Element): JSONContent {
  const content: JSONContent[] = [];

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) {
        // Unescape XML entities
        const unescaped = text
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&");
        content.push({ type: "text", text: unescaped });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      if (tagName === "blank") {
        content.push(parseBlank(el, () => []));
      } else if (tagName === "br") {
        content.push({ type: "hardBreak" });
      } else if (TAG_TO_MARK[tagName]) {
        // Handle mark tags (b, i, u, s, code)
        const markType = TAG_TO_MARK[tagName];
        const innerContent = parseInlineWithMarks(el);
        for (const node of innerContent) {
          if (node.type === "text") {
            node.marks = node.marks || [];
            node.marks.push({ type: markType });
          }
          content.push(node);
        }
      }
    }
  }

  return {
    type: "paragraph",
    content: content.length > 0 ? content : undefined,
  };
}

/**
 * Parse inline content with marks
 */
function parseInlineWithMarks(element: Element): JSONContent[] {
  const result: JSONContent[] = [];

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) {
        const unescaped = text
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&");
        result.push({ type: "text", text: unescaped });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      if (tagName === "blank") {
        result.push(parseBlank(el, () => []));
      } else if (tagName === "br") {
        result.push({ type: "hardBreak" });
      } else if (TAG_TO_MARK[tagName]) {
        const markType = TAG_TO_MARK[tagName];
        const innerContent = parseInlineWithMarks(el);
        for (const node of innerContent) {
          if (node.type === "text") {
            node.marks = node.marks || [];
            node.marks.push({ type: markType });
          }
          result.push(node);
        }
      }
    }
  }

  return result;
}

/**
 * Parse XML string to Tiptap JSON
 */
export function xmlToJSON(xml: string): JSONContent {
  // Parse XML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent}`);
  }

  // Get root element
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "lesson") {
    throw new Error(
      `Expected <lesson> root element, got <${root.tagName.toLowerCase()}>`,
    );
  }

  // Parse the document
  const result = parseElement(root);
  if (!result) {
    throw new Error("Failed to parse XML document");
  }

  return result;
}

/**
 * Parse XML string and apply to Tiptap editor
 */
export function fromXML(
  editor: Editor,
  xml: string,
  options: FromXMLOptions = {},
): void {
  const opts: FromXMLOptions = {
    replace: options.replace ?? true,
  };

  const json = xmlToJSON(xml);

  if (opts.replace) {
    editor.commands.setContent(json);
  } else {
    // Insert at current position
    editor.commands.insertContent(json.content || []);
  }
}

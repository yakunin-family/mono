import type { ValidationResult } from "./types";
import { ALL_TAGS, MARK_TAGS } from "./types";

/**
 * Set of all valid tag names (lowercase)
 */
const VALID_TAGS = new Set<string>(ALL_TAGS);

/**
 * Tags that are marks and can appear inline
 */
const MARK_TAG_SET = new Set<string>(MARK_TAGS);

/**
 * Validate XML structure without applying it
 */
export function validateXML(xml: string): ValidationResult {
  // Check for empty input
  if (!xml || xml.trim() === "") {
    return { valid: false, error: "Empty XML input" };
  }

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return {
      valid: false,
      error: `Invalid XML syntax: ${parseError.textContent?.substring(0, 100)}`,
    };
  }

  // Check root element
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== "lesson") {
    return {
      valid: false,
      error: `Expected <lesson> root element, got <${root.tagName.toLowerCase()}>`,
    };
  }

  // Recursively validate all elements
  const validationError = validateElement(root);
  if (validationError) {
    return { valid: false, error: validationError };
  }

  return { valid: true };
}

/**
 * Recursively validate an element and its children
 */
function validateElement(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();

  // Check if tag is valid
  if (!VALID_TAGS.has(tagName)) {
    return `Unknown tag: <${tagName}>`;
  }

  // Validate specific element types
  switch (tagName) {
    case "blank": {
      // blank must have answer attribute
      if (!element.hasAttribute("answer")) {
        return "<blank> element must have 'answer' attribute";
      }
      break;
    }

    case "h1":
    case "h2":
    case "h3": {
      // Headings should not contain block-level elements
      for (const child of Array.from(element.children)) {
        const childTag = child.tagName.toLowerCase();
        if (
          !MARK_TAG_SET.has(childTag) &&
          childTag !== "br" &&
          childTag !== "blank"
        ) {
          return `<${tagName}> cannot contain block-level element <${childTag}>`;
        }
      }
      break;
    }

    case "p": {
      // Paragraphs should only contain inline content
      for (const child of Array.from(element.children)) {
        const childTag = child.tagName.toLowerCase();
        if (
          !MARK_TAG_SET.has(childTag) &&
          childTag !== "br" &&
          childTag !== "blank"
        ) {
          return `<p> cannot contain block-level element <${childTag}>`;
        }
      }
      break;
    }

    case "ul": {
      // Lists should only contain li
      for (const child of Array.from(element.children)) {
        if (child.tagName.toLowerCase() !== "li") {
          return `<${tagName}> can only contain <li> elements, found <${child.tagName.toLowerCase()}>`;
        }
      }
      break;
    }

    case "ol": {
      // Lists should only contain li
      for (const child of Array.from(element.children)) {
        if (child.tagName.toLowerCase() !== "li") {
          return `<${tagName}> can only contain <li> elements, found <${child.tagName.toLowerCase()}>`;
        }
      }
      // ordered list start must be a valid number if present
      const start = element.getAttribute("start");
      if (start !== null && isNaN(parseInt(start, 10))) {
        return "<ol> 'start' attribute must be a number";
      }
      break;
    }

    case "writing-area": {
      // writing-area lines must be a valid number if present
      const lines = element.getAttribute("lines");
      if (
        lines !== null &&
        (isNaN(parseInt(lines, 10)) || parseInt(lines, 10) < 1)
      ) {
        return "<writing-area> 'lines' attribute must be a positive number";
      }
      break;
    }
  }

  // Recursively validate children (except for self-closing elements)
  for (const child of Array.from(element.children)) {
    const error = validateElement(child);
    if (error) {
      return error;
    }
  }

  return null;
}

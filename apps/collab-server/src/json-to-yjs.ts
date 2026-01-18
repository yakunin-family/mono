import * as Y from "yjs";

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

interface TiptapDocument {
  type: "doc";
  content: TiptapNode[];
}

/**
 * Convert a Tiptap JSON node to a Yjs XmlElement or XmlText
 */
function convertNode(
  node: TiptapNode,
  parent: Y.XmlFragment | Y.XmlElement,
): void {
  if (node.type === "text") {
    // Text node - create XmlText
    const text = new Y.XmlText();
    if (node.text) {
      // Apply marks if present
      if (node.marks && node.marks.length > 0) {
        const attrs: Record<string, unknown> = {};
        for (const mark of node.marks) {
          attrs[mark.type] = mark.attrs || true;
        }
        text.insert(0, node.text, attrs);
      } else {
        text.insert(0, node.text);
      }
    }
    parent.push([text]);
  } else {
    // Element node - create XmlElement
    const element = new Y.XmlElement(node.type);

    // Set attributes (Yjs accepts any serializable value)
    if (node.attrs) {
      for (const [key, value] of Object.entries(node.attrs)) {
        if (value !== null && value !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (element as Y.XmlElement<any>).setAttribute(key, value);
        }
      }
    }

    // Process children
    if (node.content) {
      for (const child of node.content) {
        convertNode(child, element);
      }
    }

    parent.push([element]);
  }
}

/**
 * Convert Tiptap JSON content to a Yjs XmlFragment.
 * The content should be the array from the "content" field of a Tiptap document.
 *
 * @param content - Array of Tiptap nodes (the "content" array from Tiptap JSON)
 * @param fragment - The XmlFragment to populate
 */
export function tiptapJsonToYFragment(
  content: TiptapNode[],
  fragment: Y.XmlFragment,
): void {
  for (const node of content) {
    convertNode(node, fragment);
  }
}

/**
 * Initialize a Yjs document with Tiptap JSON content.
 * Uses the "default" fragment name that Tiptap Collaboration expects.
 *
 * @param ydoc - The Yjs document to initialize
 * @param jsonContent - The full Tiptap JSON document string ({ type: "doc", content: [...] })
 */
export function initializeYDocFromTemplate(
  ydoc: Y.Doc,
  jsonContent: string,
): void {
  const doc = JSON.parse(jsonContent) as TiptapDocument;

  // Tiptap Collaboration uses "default" as the fragment name
  const fragment = ydoc.getXmlFragment("default");

  tiptapJsonToYFragment(doc.content, fragment);
}

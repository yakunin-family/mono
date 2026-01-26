import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { WritingAreaView } from "./WritingAreaView";

export interface WritingAreaAttributes {
  id: string;
  lines: number;
  placeholder: string;
}

export const WritingArea = Node.create({
  name: "writingArea",

  group: "block",
  content: "paragraph+",

  addAttributes() {
    return {
      // Note: id attribute is handled by UniqueID extension
      // We keep parseHTML for backwards compat but don't need renderHTML
      // since UniqueID renders it as data-id automatically
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-id": attributes.id };
        },
      },
      lines: {
        default: 5,
        parseHTML: (element) => {
          const lines = element.getAttribute("data-lines");
          return lines ? parseInt(lines, 10) : 5;
        },
        renderHTML: (attributes) => ({
          "data-lines": attributes.lines,
        }),
      },
      placeholder: {
        default: "Write your answer here...",
        parseHTML: (element) =>
          element.getAttribute("data-placeholder") ||
          "Write your answer here...",
        renderHTML: (attributes) => {
          if (!attributes.placeholder) return {};
          return { "data-placeholder": attributes.placeholder };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="writing-area"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "writing-area" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WritingAreaView);
  },
});

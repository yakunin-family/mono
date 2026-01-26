import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { BlankView } from "./BlankView";
import type { EditorMode } from "@/types";

export interface BlankAttributes {
  id: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  hint: string | null;
  studentAnswer: string;
}

declare module "@tiptap/core" {
  interface Storage {
    editorMode: EditorMode;
  }
}

export const Blank = Node.create({
  name: "blank",

  group: "inline",
  inline: true,
  atom: true,

  addStorage() {
    return {
      editorMode: "student" as EditorMode,
    };
  },

  addAttributes() {
    return {
      correctAnswer: {
        default: "",
      },
      alternativeAnswers: {
        default: [],
      },
      hint: {
        default: null,
      },
      studentAnswer: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="blank"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "blank",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlankView);
  },
});

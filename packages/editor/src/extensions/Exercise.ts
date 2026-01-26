import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ExerciseView } from "./ExerciseView";

export interface ExerciseAttributes {
  id: string;
  index: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    exercise: {
      insertExercise: (attributes?: { id?: string }) => ReturnType;
      updateExercise: (attributes: Partial<ExerciseAttributes>) => ReturnType;
    };
  }
}

export const Exercise = Node.create({
  name: "exercise",

  group: "block",

  content: "block+",

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-id": attributes.id };
        },
      },
      index: {
        default: 1,
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-index") || "1", 10),
        renderHTML: (attributes) => ({
          "data-index": String(attributes.index),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="exercise"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "exercise",
        class: "exercise",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExerciseView);
  },

  addCommands() {
    return {
      insertExercise:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [{ type: "paragraph" }],
          });
        },
      updateExercise:
        (attributes) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attributes);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const exercises: { pos: number; currentIndex: number }[] = [];
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "exercise") {
              exercises.push({ pos, currentIndex: node.attrs.index });
            }
          });

          const needsUpdate = exercises.some(
            (ex, i) => ex.currentIndex !== i + 1,
          );
          if (!needsUpdate) return null;

          const tr = newState.tr;
          exercises.forEach((ex, i) => {
            if (ex.currentIndex !== i + 1) {
              const node = newState.doc.nodeAt(ex.pos);
              if (node) {
                tr.setNodeMarkup(ex.pos, undefined, {
                  ...node.attrs,
                  index: i + 1,
                });
              }
            }
          });

          return tr;
        },
      }),
    ];
  },
});

import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ExerciseView } from "./ExerciseView";

export interface ExerciseAttributes {
  instanceId: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    exercise: {
      insertExercise: (attributes?: { instanceId?: string }) => ReturnType;
      updateExercise: (attributes: Partial<ExerciseAttributes>) => ReturnType;
    };
  }
}

export const Exercise = Node.create({
  name: "exercise",

  group: "block",

  content: "block*",

  draggable: true,

  addAttributes() {
    return {
      instanceId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-instance-id"),
        renderHTML: (attributes) => {
          if (!attributes.instanceId) return {};
          return {
            "data-instance-id": attributes.instanceId,
          };
        },
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
      insertExercise: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
      updateExercise: (attributes) => ({ commands }) => {
        return commands.updateAttributes(this.name, attributes);
      },
    };
  },
});

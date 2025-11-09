// slotNode.ts
import { mergeAttributes, Node } from "@tiptap/core";

export const ExerciseTaskDefinition = Node.create({
  name: "exerciseTaskDefinition",

  group: "block",

  content: "block*",

  parseHTML() {
    return [
      {
        tag: 'div[data-type="exerciseTaskDefinition"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "exerciseTaskDefinition",
        class: "exercise-task-definition",
      }),
      0,
    ];
  },
});

import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ExerciseGenerationView } from "./ExerciseGenerationView";

export interface ExerciseGenerationAttributes {
  sessionId: string | null;
  status: string;
  promptText: string;
  model: string;
}

export const ExerciseGeneration = Node.create({
  name: "exerciseGeneration",

  group: "block",

  atom: true,

  draggable: true,

  addStorage() {
    return {
      startGeneration: null,
    };
  },

  addAttributes() {
    return {
      sessionId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-session-id"),
        renderHTML: (attributes) => {
          if (!attributes.sessionId) return {};
          return {
            "data-session-id": attributes.sessionId,
          };
        },
      },
      status: {
        default: "input",
        parseHTML: (element) => element.getAttribute("data-status") || "input",
        renderHTML: (attributes) => {
          return {
            "data-status": attributes.status,
          };
        },
      },
      promptText: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-prompt-text") || "",
        renderHTML: (attributes) => {
          return {
            "data-prompt-text": attributes.promptText,
          };
        },
      },
      model: {
        default: "openai/gpt-4o",
        parseHTML: (element) =>
          element.getAttribute("data-model") || "openai/gpt-4o",
        renderHTML: (attributes) => {
          return {
            "data-model": attributes.model,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="exercise-generation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "exercise-generation",
        class: "exercise-generation",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExerciseGenerationView);
  },
});

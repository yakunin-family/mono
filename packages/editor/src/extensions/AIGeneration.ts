import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { AIGenerationView } from "./AIGenerationView";

export interface AIGenerationAttributes {
  generationId: string | null;
  status: string;
  promptText: string;
}

export const AIGeneration = Node.create({
  name: "aiGeneration",

  group: "block",

  atom: true,

  draggable: true,

  addStorage() {
    return {
      createGeneration: null,
    };
  },

  addAttributes() {
    return {
      generationId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-generation-id"),
        renderHTML: (attributes) => {
          if (!attributes.generationId) return {};
          return {
            "data-generation-id": attributes.generationId,
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="ai-generation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "ai-generation",
        class: "ai-generation",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIGenerationView);
  },
});

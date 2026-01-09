import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ExerciseGenerationView } from "./ExerciseGenerationView";
import { ConvexReactClient } from "convex/react";

export interface ExerciseGenerationAttributes {
  sessionId: string | null;
  status: string;
  promptText: string;
  model: string;
}

export interface ExerciseGenerationStorage {
  startGeneration:
    | ((promptText: string, model: string) => Promise<{ sessionId: string }>)
    | null
    | undefined;
  convexClient?: ConvexReactClient;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    exerciseGeneration: {
      /**
       * Insert an exercise generation node into the document.
       */
      insertExerciseGeneration: (
        attributes?: Partial<ExerciseGenerationAttributes>,
      ) => ReturnType;
      /**
       * Update attributes of an existing exercise generation node.
       */
      updateExerciseGeneration: (
        attributes: Partial<ExerciseGenerationAttributes>,
      ) => ReturnType;
    };
  }

  interface Storage {
    exerciseGeneration: ExerciseGenerationStorage;
  }
}

export const ExerciseGeneration = Node.create({
  name: "exerciseGeneration",

  group: "block",

  atom: true,

  addStorage() {
    return {
      startGeneration: null,
      convexClient: null,
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
        parseHTML: (element) => element.getAttribute("data-prompt-text") || "",
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

  addCommands() {
    return {
      insertExerciseGeneration:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
      updateExerciseGeneration:
        (attributes) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attributes);
        },
    };
  },
});

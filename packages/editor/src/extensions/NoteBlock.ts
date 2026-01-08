import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { NoteBlockView } from "./NoteBlockView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    noteBlock: {
      insertNoteBlock: () => ReturnType;
    };
  }
}

export const NoteBlock = Node.create({
  name: "noteBlock",

  group: "block",

  content: "block+",

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="note-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "note-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteBlockView);
  },

  addCommands() {
    return {
      insertNoteBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "paragraph",
              },
            ],
          });
        },
    };
  },
});

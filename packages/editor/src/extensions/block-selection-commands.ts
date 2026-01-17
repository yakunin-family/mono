import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { DOMSerializer, Fragment } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

import { BlockSelection } from "./MarqueeSelection";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockSelectionCommands: {
      deleteBlockSelection: () => ReturnType;
      copyBlockSelection: () => ReturnType;
      cutBlockSelection: () => ReturnType;
    };
  }
}

export const BlockSelectionCommands = Extension.create({
  name: "blockSelectionCommands",

  addCommands() {
    return {
      deleteBlockSelection:
        () =>
        ({ state, dispatch }) => {
          const { selection, doc, tr } = state;

          if (!(selection instanceof BlockSelection)) {
            return false;
          }

          if (!dispatch) {
            return true;
          }

          // Delete blocks in reverse order to avoid position shifts
          const positions = [...selection.blockPositions].sort((a, b) => b - a);

          for (const pos of positions) {
            const node = tr.doc.nodeAt(pos);
            if (node) {
              tr.delete(pos, pos + node.nodeSize);
            }
          }

          // If doc becomes empty, insert an empty paragraph
          if (tr.doc.content.size === 0) {
            const paragraphType = state.schema.nodes.paragraph;
            if (paragraphType) {
              tr.insert(0, paragraphType.create());
            }
          }

          // Set cursor to beginning of document or where first block was
          const cursorPos = Math.min(
            selection.blockPositions[0] ?? 0,
            tr.doc.content.size,
          );
          tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos)));

          dispatch(tr);
          return true;
        },

      copyBlockSelection:
        () =>
        ({ state, view }) => {
          const { selection, doc } = state;

          // debugger;

          if (!(selection instanceof BlockSelection)) {
            return false;
          }

          // Collect nodes
          const nodes: PMNode[] = [];
          selection.forEachBlock((node) => {
            nodes.push(node);
          });

          if (nodes.length === 0) {
            return false;
          }

          // Create a fragment from the collected nodes
          const fragment = Fragment.from(nodes);

          // Serialize to HTML
          const serializer = DOMSerializer.fromSchema(state.schema);
          const div = document.createElement("div");

          for (const node of nodes) {
            const domNode = serializer.serializeNode(node);
            div.appendChild(domNode);
          }

          const html = div.innerHTML;
          const text = nodes.map((n) => n.textContent).join("\n\n");

          // Write to clipboard
          const clipboardItem = new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            // "text/plain": new Blob([text], { type: "text/plain" }),
          });

          navigator.clipboard.write([clipboardItem]).catch((err) => {
            console.error("Failed to copy to clipboard:", err);
          });

          return true;
        },

      cutBlockSelection:
        () =>
        ({ commands }) => {
          const copied = commands.copyBlockSelection();
          if (!copied) {
            return false;
          }
          return commands.deleteBlockSelection();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Delete: () => {
        if (this.editor.state.selection instanceof BlockSelection) {
          return this.editor.commands.deleteBlockSelection();
        }
        return false;
      },
      Backspace: () => {
        if (this.editor.state.selection instanceof BlockSelection) {
          return this.editor.commands.deleteBlockSelection();
        }
        return false;
      },
      "Mod-c": () => {
        if (this.editor.state.selection instanceof BlockSelection) {
          return this.editor.commands.copyBlockSelection();
        }
        return false;
      },
      "Mod-x": () => {
        if (this.editor.state.selection instanceof BlockSelection) {
          return this.editor.commands.cutBlockSelection();
        }
        return false;
      },
    };
  },
});

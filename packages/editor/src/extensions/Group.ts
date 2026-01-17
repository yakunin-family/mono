import { mergeAttributes, Node } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Fragment, Slice } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { GroupView } from "./GroupView";
import { BlockSelection } from "./MarqueeSelection";

export interface GroupAttributes {
  id: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    group: {
      wrapInGroup: () => ReturnType;
      unwrapGroup: () => ReturnType;
    };
  }
}

export const Group = Node.create({
  name: "group",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-group-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-group-id": attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="group"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "group",
        class: "group-wrapper",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GroupView);
  },

  addCommands() {
    return {
      wrapInGroup:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;

          let blocks: PMNode[] = [];
          let startPos: number;
          let endPos: number;

          // Handle BlockSelection (marquee multi-select) directly
          if (selection instanceof BlockSelection) {
            const positions = selection.blockPositions;

            for (const pos of positions) {
              const node = state.doc.nodeAt(pos);
              if (node) {
                blocks.push(node);
              }
            }

            if (blocks.length === 0) return false;

            startPos = positions[0]!;
            const lastPos = positions[positions.length - 1]!;
            const lastNode = state.doc.nodeAt(lastPos);
            endPos = lastPos + (lastNode?.nodeSize ?? 0);
          } else {
            // Existing TextSelection logic
            const { from, to } = selection;
            const $from = state.doc.resolve(from);
            const $to = state.doc.resolve(to);

            startPos = from;
            endPos = to;

            // Walk up to find the start of the first block
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (node.type.name !== "doc" && node.isBlock) {
                startPos = $from.before(d);
                break;
              }
            }

            // Walk up to find the end of the last block
            for (let d = $to.depth; d > 0; d--) {
              const node = $to.node(d);
              if (node.type.name !== "doc" && node.isBlock) {
                endPos = $to.after(d);
                break;
              }
            }

            // Collect all block nodes in the range
            state.doc.nodesBetween(startPos, endPos, (node, pos) => {
              // Only grab top-level blocks (direct children of doc or other containers)
              if (
                node.isBlock &&
                node.type.name !== "doc" &&
                pos >= startPos &&
                pos + node.nodeSize <= endPos
              ) {
                blocks.push(node);
                return false; // Don't descend
              }
              return true;
            });
          }

          if (blocks.length === 0) return false;

          const groupType = state.schema.nodes.group;
          if (!groupType) return false;

          if (dispatch) {
            const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const groupNode = groupType.create(
              { id: groupId },
              Fragment.from(blocks)
            );

            const tr = state.tr.replaceRange(
              startPos,
              endPos,
              new Slice(Fragment.from(groupNode), 0, 0)
            );
            tr.setSelection(NodeSelection.create(tr.doc, startPos));
            dispatch(tr);
          }

          return true;
        },

      unwrapGroup:
        () =>
        ({ commands }) => {
          return commands.lift("group");
        },
    };
  },
});

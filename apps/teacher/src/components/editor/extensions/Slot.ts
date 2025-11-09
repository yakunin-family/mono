// slotNode.ts
import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { SlotComponent } from "./SlotView";

export const Slot = Node.create({
  name: "slot",

  group: "inline",

  inline: true,

  content: "text*",

  atom: false,

  marks: "",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      placeholder: {
        default: "dsadsdas",
        parseHTML: (element) => element.getAttribute("data-placeholder") || "",
        renderHTML: (attributes) => ({
          "data-placeholder": attributes.placeholder,
        }),
      },
      minWidth: {
        default: "150px",
        parseHTML: (element) =>
          element.getAttribute("data-min-width") || "150px",
        renderHTML: (attributes) => ({
          "data-min-width": attributes.minWidth,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="slot"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "slot",
        style: `min-width: ${node.attrs.minWidth}`,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlotComponent);
  },

  addProseMirrorPlugins() {
    const slotPlugin = new Plugin({
      key: new PluginKey("slotPlugin"),
    });

    return [slotPlugin];
  },
});

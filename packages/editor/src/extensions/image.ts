import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImageView } from "./ImageView";

export interface ImageAttributes {
  storageId: string;
  caption: string | null;
  alt: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      insertImage: (attributes: ImageAttributes) => ReturnType;
    };
  }
}

export const Image = Node.create({
  name: "image",

  group: "block",

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      storageId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-storage-id") || "",
        renderHTML: (attributes) => {
          if (!attributes.storageId) return {};
          return { "data-storage-id": attributes.storageId };
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-caption"),
        renderHTML: (attributes) => {
          if (!attributes.caption) return {};
          return { "data-caption": attributes.caption };
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-alt"),
        renderHTML: (attributes) => {
          if (!attributes.alt) return {};
          return { "data-alt": attributes.alt };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image",
        class: "image",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },

  addCommands() {
    return {
      insertImage:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const mode = this.editor.storage.editorMode;
            if (mode !== "teacher-editor") {
              return false;
            }

            const files = event.clipboardData?.files;
            if (!files || files.length === 0) {
              return false;
            }

            let hasImage = false;
            for (let i = 0; i < files.length; i++) {
              const file = files.item(i);
              if (!file) continue;

              const isImage = /^image\/(png|jpeg|gif|webp)$/.test(file.type);

              if (isImage) {
                hasImage = true;
                window.dispatchEvent(
                  new CustomEvent("uploadImage", {
                    detail: { file, editor: this.editor, range: null },
                  }),
                );
              }
            }

            return hasImage;
          },
        },
      }),
    ];
  },
});

import { Editor, Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import { computePosition } from "@floating-ui/dom";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table,
  Image,
  Code,
  FileText,
  Sparkles,
} from "lucide-react";
import { SlashCommandMenu } from "../components/SlashCommandMenu";
import type {} from "@tiptap/extension-table";
import type {} from "@tiptap/extension-image";

export interface CommandItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: any }) => void;
}

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      canEdit: true,
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.canEdit) {
      return [];
    }

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }): CommandItem[] => {
          const items: CommandItem[] = [
            {
              title: "Heading 1",
              icon: Heading1,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 1 })
                  .run();
              },
            },
            {
              title: "Heading 2",
              icon: Heading2,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 2 })
                  .run();
              },
            },
            {
              title: "Heading 3",
              icon: Heading3,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .setNode("heading", { level: 3 })
                  .run();
              },
            },
            {
              title: "Bullet List",
              icon: List,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBulletList()
                  .run();
              },
            },
            {
              title: "Numbered List",
              icon: ListOrdered,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleOrderedList()
                  .run();
              },
            },
            {
              title: "Blockquote",
              icon: Quote,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .toggleBlockquote()
                  .run();
              },
            },
            {
              title: "Table",
              icon: Table,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              },
            },
            {
              title: "Image",
              icon: Image,
              command: ({ editor, range }) => {
                const url = prompt("Enter image URL:");
                if (url) {
                  editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setImage({ src: url })
                    .run();
                }
              },
            },
            {
              title: "Exercise",
              icon: FileText,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent({ type: "exercise" })
                  .run();
              },
            },
            {
              title: "Exercise Generation",
              icon: Sparkles,
              command: ({ editor, range }) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent({ type: "exerciseGeneration" })
                  .run();
              },
            },
          ];

          return items.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()),
          );
        },
        render: () => {
          let component: ReactRenderer<any>;
          let popup: HTMLElement;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              popup = component.element;
              popup.style.position = "absolute";
              popup.style.top = "0";
              popup.style.left = "0";
              popup.style.zIndex = "50";

              document.body.appendChild(popup);

              if (!props.clientRect) {
                return;
              }

              // Position the menu using floating-ui
              const rect = props.clientRect();
              if (rect) {
                computePosition(
                  {
                    getBoundingClientRect: () => rect,
                  },
                  popup,
                  {
                    placement: "bottom-start",
                  },
                ).then(({ x, y }) => {
                  popup.style.transform = `translate(${x}px, ${y}px)`;
                });
              }
            },
            onUpdate(props: any) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              // Update position
              const rect = props.clientRect();
              if (rect) {
                computePosition(
                  {
                    getBoundingClientRect: () => rect,
                  },
                  popup,
                  {
                    placement: "bottom-start",
                  },
                ).then(({ x, y }) => {
                  popup.style.transform = `translate(${x}px, ${y}px)`;
                });
              }
            },
            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                return true;
              }

              return component.ref?.onKeyDown(props);
            },
            onExit() {
              if (popup && popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

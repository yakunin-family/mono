import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";

import {
  type CommandItem,
  CommandList,
  type CommandListRef,
  defaultCommands,
} from "./CommandList";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return defaultCommands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase()),
          );
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null;
          let popup: HTMLDivElement | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(CommandList, {
                props: {
                  ...props,
                  items: props.items as CommandItem[],
                },
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = document.createElement("div");
              popup.style.position = "absolute";
              popup.style.zIndex = "50";
              document.body.appendChild(popup);

              // ReactRenderer.element is already an HTMLElement, just append it
              popup.appendChild(component.element);

              const rect = props.clientRect();
              if (rect) {
                popup.style.top = `${rect.top + rect.height + window.scrollY}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },

            onUpdate: (props: SuggestionProps) => {
              component?.updateProps({
                ...props,
                items: props.items as CommandItem[],
              });

              if (!props.clientRect || !popup) {
                return;
              }

              const rect = props.clientRect();
              if (rect) {
                popup.style.top = `${rect.top + rect.height + window.scrollY}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
                component?.destroy();
                return true;
              }

              return component?.ref?.onKeyDown(props) || false;
            },

            onExit: () => {
              if (popup) {
                popup.remove();
                popup = null;
              }
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

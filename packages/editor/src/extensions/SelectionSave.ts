import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

import { BlockSelection } from "./MarqueeSelection";

export interface SelectionSaveStorage {
  hasMultiBlockSelection: boolean;
  selectionCoords: { top: number; left: number } | null;
  saveSection?: (title: string, content: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Storage {
    selectionSave: SelectionSaveStorage;
  }
}

export const selectionSavePluginKey = new PluginKey("selectionSave");

const getSelectionCoords = (
  view: EditorView,
): { top: number; left: number } | null => {
  const { from } = view.state.selection;
  try {
    const coords = view.coordsAtPos(from);
    return { top: coords.top, left: coords.left };
  } catch {
    return null;
  }
};

export const SelectionSave = Extension.create({
  name: "selectionSave",

  addStorage() {
    return {
      hasMultiBlockSelection: false,
      selectionCoords: null,
      saveSection: undefined,
    } satisfies SelectionSaveStorage;
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: selectionSavePluginKey,
        view: () => {
          return {
            update: (view) => {
              const selection = view.state.selection;
              const isBlockSelection = selection instanceof BlockSelection;
              const hasMultiBlock =
                isBlockSelection && selection.blockPositions.length >= 2;

              if (hasMultiBlock) {
                const coords = getSelectionCoords(view);
                extension.storage.hasMultiBlockSelection = true;
                extension.storage.selectionCoords = coords;
              } else {
                extension.storage.hasMultiBlockSelection = false;
                extension.storage.selectionCoords = null;
              }

              window.dispatchEvent(
                new CustomEvent("selectionSaveUpdate", {
                  detail: {
                    hasMultiBlockSelection:
                      extension.storage.hasMultiBlockSelection,
                    selectionCoords: extension.storage.selectionCoords,
                  },
                }),
              );
            },
          };
        },
      }),
    ];
  },
});

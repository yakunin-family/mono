import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";

import { BlockSelection } from "./BlockSelection";
import type {
  BlockInfo,
  MarqueeRect,
  MarqueeSelectionStorage,
} from "./types";

export const marqueeSelectionPluginKey = new PluginKey<MarqueePluginState>(
  "marqueeSelection"
);

interface MarqueePluginState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const isOutsideContent = (view: EditorView, x: number, y: number): boolean => {
  let isInsideAnyBlock = false;

  view.state.doc.forEach((node, pos) => {
    if (node.isBlock && !isInsideAnyBlock) {
      try {
        const domNode = view.nodeDOM(pos);
        if (domNode instanceof HTMLElement) {
          const rect = domNode.getBoundingClientRect();
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            isInsideAnyBlock = true;
          }
        }
      } catch {
        // Node may not have DOM representation
      }
    }
  });

  return !isInsideAnyBlock;
};

const getTopLevelBlocksWithRects = (view: EditorView): BlockInfo[] => {
  const blocks: BlockInfo[] = [];

  view.state.doc.forEach((node, pos) => {
    if (node.isBlock) {
      try {
        const domNode = view.nodeDOM(pos);
        if (domNode instanceof HTMLElement) {
          blocks.push({
            pos,
            node,
            domRect: domNode.getBoundingClientRect(),
          });
        }
      } catch {
        // Node may not have DOM representation
      }
    }
  });

  return blocks;
};

const rectsIntersect = (blockRect: DOMRect, marquee: MarqueeRect): boolean => {
  const marqueeLeft = Math.min(marquee.startX, marquee.endX);
  const marqueeRight = Math.max(marquee.startX, marquee.endX);
  const marqueeTop = Math.min(marquee.startY, marquee.endY);
  const marqueeBottom = Math.max(marquee.startY, marquee.endY);

  return !(
    blockRect.right < marqueeLeft ||
    blockRect.left > marqueeRight ||
    blockRect.bottom < marqueeTop ||
    blockRect.top > marqueeBottom
  );
};

const findIntersectingBlocks = (
  view: EditorView,
  marquee: MarqueeRect
): number[] => {
  const blocks = getTopLevelBlocksWithRects(view);
  return blocks
    .filter((block) => rectsIntersect(block.domRect, marquee))
    .map((block) => block.pos)
    .sort((a, b) => a - b);
};

const createMarqueeSelectionPlugin = (
  storage: MarqueeSelectionStorage
): Plugin => {
  let windowMoveHandler: ((e: MouseEvent) => void) | null = null;
  let windowUpHandler: ((e: MouseEvent) => void) | null = null;

  const cleanup = () => {
    if (windowMoveHandler) {
      window.removeEventListener("mousemove", windowMoveHandler);
      windowMoveHandler = null;
    }
    if (windowUpHandler) {
      window.removeEventListener("mouseup", windowUpHandler);
      windowUpHandler = null;
    }
  };

  return new Plugin({
    key: marqueeSelectionPluginKey,

    state: {
      init: (): MarqueePluginState => ({
        isActive: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      }),

      apply: (tr, state): MarqueePluginState => {
        const meta = tr.getMeta(marqueeSelectionPluginKey);
        if (meta) return meta;
        return state;
      },
    },

    props: {
      handleDOMEvents: {
        mousedown: (view, event) => {
          if (!isOutsideContent(view, event.clientX, event.clientY)) return false;
          if (event.button !== 0) return false;

          const pluginState: MarqueePluginState = {
            isActive: true,
            startX: event.clientX,
            startY: event.clientY,
            currentX: event.clientX,
            currentY: event.clientY,
          };

          view.dispatch(
            view.state.tr.setMeta(marqueeSelectionPluginKey, pluginState)
          );

          storage.isActive = true;
          storage.rect = {
            startX: event.clientX,
            startY: event.clientY,
            endX: event.clientX,
            endY: event.clientY,
          };

          window.dispatchEvent(new CustomEvent("marqueeUpdate"));

          view.dom.classList.add("marquee-dragging");

          windowMoveHandler = (e: MouseEvent) => {
            const state = marqueeSelectionPluginKey.getState(view.state);
            if (!state?.isActive) return;

            const newState: MarqueePluginState = {
              ...state,
              currentX: e.clientX,
              currentY: e.clientY,
            };

            view.dispatch(
              view.state.tr.setMeta(marqueeSelectionPluginKey, newState)
            );

            storage.rect = {
              startX: state.startX,
              startY: state.startY,
              endX: e.clientX,
              endY: e.clientY,
            };

            window.dispatchEvent(new CustomEvent("marqueeUpdate"));
          };

          windowUpHandler = (e: MouseEvent) => {
            const state = marqueeSelectionPluginKey.getState(view.state);
            if (!state?.isActive) {
              cleanup();
              return;
            }

            const marqueeRect: MarqueeRect = {
              startX: state.startX,
              startY: state.startY,
              endX: e.clientX,
              endY: e.clientY,
            };

            const blockPositions = findIntersectingBlocks(view, marqueeRect);

            const resetState: MarqueePluginState = {
              isActive: false,
              startX: 0,
              startY: 0,
              currentX: 0,
              currentY: 0,
            };

            storage.isActive = false;
            storage.rect = null;

            window.getSelection()?.removeAllRanges();
            view.dom.classList.remove("marquee-dragging");
            window.dispatchEvent(new CustomEvent("marqueeEnd"));

            cleanup();

            if (blockPositions.length > 0) {
              const selection = BlockSelection.create(
                view.state.doc,
                blockPositions
              );
              const tr = view.state.tr
                .setMeta(marqueeSelectionPluginKey, resetState)
                .setSelection(selection);
              view.dispatch(tr);
            } else {
              view.dispatch(
                view.state.tr.setMeta(marqueeSelectionPluginKey, resetState)
              );
            }
          };

          window.addEventListener("mousemove", windowMoveHandler);
          window.addEventListener("mouseup", windowUpHandler);

          event.preventDefault();
          return true;
        },
      },

      decorations: (state) => {
        if (!(state.selection instanceof BlockSelection)) {
          return DecorationSet.empty;
        }

        const decorations: Decoration[] = [];
        state.selection.forEachBlock((node, pos) => {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: "block-selected",
            })
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },

    view: () => ({
      destroy: () => {
        cleanup();
        storage.isActive = false;
        storage.rect = null;
      },
    }),
  });
};

export const MarqueeSelection = Extension.create({
  name: "marqueeSelection",

  addStorage() {
    return {
      isActive: false,
      rect: null,
    } satisfies MarqueeSelectionStorage;
  },

  addProseMirrorPlugins() {
    return [createMarqueeSelectionPlugin(this.storage)];
  },
});

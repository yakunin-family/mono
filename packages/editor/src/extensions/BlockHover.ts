import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// Find a block element at given coordinates
const findBlockAtCoords = (
  view: EditorView,
  x: number,
  y: number,
): { pos: number; element: HTMLElement } | null => {
  const elements = document.elementsFromPoint(x, y);

  for (const el of elements) {
    if (!view.dom.contains(el)) continue;
    if (!(el instanceof HTMLElement)) continue;

    try {
      const pos = view.posAtDOM(el, 0);
      if (pos == null) continue;

      const $pos = view.state.doc.resolve(pos);

      for (let d = $pos.depth; d >= 0; d--) {
        const node = $pos.node(d);
        if (node.isBlock && node.type.name !== "doc") {
          const blockPos = d === 0 ? 0 : $pos.before(d);
          const domNode = view.nodeDOM(blockPos);
          if (domNode instanceof HTMLElement) {
            return { pos: blockPos, element: domNode };
          }
        }
      }
    } catch {
      continue;
    }
  }

  return null;
};

export const BlockHover = Extension.create({
  name: "blockHover",

  addProseMirrorPlugins() {
    let buttonsElement: HTMLDivElement | null = null;
    let currentBlockPos: number | null = null;
    let currentBlockElement: HTMLElement | null = null;

    const hideButtons = () => {
      if (buttonsElement) {
        buttonsElement.classList.add("hidden");
      }
      currentBlockPos = null;
      currentBlockElement = null;
    };

    const showButtons = () => {
      if (buttonsElement) {
        buttonsElement.classList.remove("hidden");
      }
    };

    const positionButtons = (element: HTMLElement) => {
      if (!buttonsElement) return;

      const rect = element.getBoundingClientRect();
      buttonsElement.style.top = `${rect.top}px`;
      buttonsElement.style.left = `${rect.left - buttonsElement.offsetWidth - 8}px`;
    };

    const handleMouseOut = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      // Don't hide if moving to editor or buttons
      if (
        relatedTarget?.closest(".tiptap") ||
        relatedTarget?.closest("[data-block-hover-buttons]")
      ) {
        return;
      }
      hideButtons();
    };

    return [
      new Plugin({
        key: new PluginKey("blockHover"),
        view: (view) => {
          // Create the buttons container
          buttonsElement = document.createElement("div");
          buttonsElement.dataset.blockHoverButtons = "";
          buttonsElement.className = "block-hover-buttons hidden";

          // Create plus button
          const plusButton = document.createElement("button");
          plusButton.className = "block-hover-button";
          plusButton.dataset.action = "add";
          plusButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
          plusButton.title = "Add block";

          buttonsElement.appendChild(plusButton);

          // Append to editor's parent
          view.dom.parentElement?.appendChild(buttonsElement);

          // Listen for mouseout on parent
          view.dom.parentElement?.addEventListener("mouseout", handleMouseOut);

          // Handle plus button click
          plusButton.addEventListener("click", () => {
            if (currentBlockPos === null) return;
            const node = view.state.doc.nodeAt(currentBlockPos);
            if (!node) return;

            const paragraphType = view.state.schema.nodes.paragraph;
            if (!paragraphType) return;

            const insertPos = currentBlockPos + node.nodeSize;
            const tr = view.state.tr.insert(
              insertPos,
              paragraphType.create(),
            );
            view.dispatch(tr);
            view.focus();

            // Focus the new paragraph
            const newTr = view.state.tr.setSelection(
              TextSelection.near(view.state.doc.resolve(insertPos + 1)),
            );
            view.dispatch(newTr);
          });

          return {
            destroy() {
              buttonsElement?.remove();
              view.dom.parentElement?.removeEventListener(
                "mouseout",
                handleMouseOut,
              );
            },
          };
        },
        props: {
          handleDOMEvents: {
            mousemove(view, event) {
              const editorRect = view.dom.getBoundingClientRect();
              const { clientX: x, clientY: y } = event;

              // Check if mouse Y is within editor bounds
              if (y < editorRect.top || y > editorRect.bottom) {
                hideButtons();
                return false;
              }

              const result = findBlockAtCoords(view, x, y);

              if (result) {
                if (result.pos !== currentBlockPos) {
                  currentBlockPos = result.pos;
                  currentBlockElement = result.element;
                  positionButtons(result.element);
                }
                showButtons();
              } else {
                hideButtons();
              }

              return false;
            },
          },
        },
      }),
    ];
  },
});

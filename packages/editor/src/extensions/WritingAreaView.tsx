import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { WritingAreaAttributes } from "./WritingArea";
import { useEditorMode } from "@/components/DocumentEditor";

interface WritingAreaViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: WritingAreaAttributes };
}

export function WritingAreaView(props: NodeViewProps) {
  const { node, editor } = props as WritingAreaViewProps;
  const { lines, placeholder } = node.attrs;

  const mode = useEditorMode();
  const isEditable = editor.isEditable;

  const isEmpty = !node.textContent || node.textContent.trim() === "";

  return (
    <NodeViewWrapper className="writing-area-wrapper my-4">
      <div className="writing-area-content relative">
        {/* Background lines - aligned to paragraph line-height */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              transparent,
              transparent calc(var(--spacing) * 7 - 1px),
              rgb(203 213 225 / 0.4) calc(var(--spacing) * 7 - 1px),
              rgb(203 213 225 / 0.4) calc(var(--spacing) * 7)
            )`,
            backgroundSize: `100% calc(var(--spacing) * 7)`,
            minHeight: `calc(var(--spacing) * 7 * ${lines})`,
          }}
        />

        {/* Editable content */}
        <NodeViewContent
          className="relative z-10 px-2 outline-none"
          style={{
            minHeight: `calc(var(--spacing) * 7 * ${lines})`,
          }}
          data-placeholder={placeholder}
          data-empty={isEmpty}
        />
      </div>
    </NodeViewWrapper>
  );
}

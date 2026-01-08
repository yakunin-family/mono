import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

export function NoteBlockView() {
  return (
    <NodeViewWrapper
      contentEditable={true}
      suppressContentEditableWarning
      className="my-6"
    >
      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-800">
          <span className="text-base" contentEditable={false}>
            📝
          </span>
          <span className="uppercase tracking-wide" contentEditable={false}>
            Note
          </span>
        </div>
        <NodeViewContent className="text-sm" />
      </div>
    </NodeViewWrapper>
  );
}

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { BlankAttributes } from "./Blank";

interface BlankNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: BlankAttributes };
}

export function BlankView(props: NodeViewProps) {
  const { editor } = props as BlankNodeViewProps;

  const mode = editor.storage.editorMode;

  let placeholder = "[Blank]";
  if (mode === "student") {
    placeholder = "[Student Input Placeholder]";
  } else if (mode === "teacher-lesson") {
    placeholder = "[Teacher Lesson Placeholder]";
  } else if (mode === "teacher-editor") {
    placeholder = "[Teacher Editor Placeholder]";
  }

  return (
    <NodeViewWrapper as="span" className="inline-block">
      {placeholder}
    </NodeViewWrapper>
  );
}

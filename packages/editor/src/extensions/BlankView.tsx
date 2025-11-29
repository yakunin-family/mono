import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { BlankAttributes } from "./Blank";
import { StudentBlankInput } from "@/components/blank/StudentBlankInput";

interface BlankNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: BlankAttributes };
}

export function BlankView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props as BlankNodeViewProps;

  const mode = editor.storage.editorMode;
  const { studentAnswer, hint } = node.attrs;

  return (
    <NodeViewWrapper as="span" className="inline-block">
      {mode === "student" && (
        <StudentBlankInput
          value={studentAnswer}
          onChange={(val) => updateAttributes({ studentAnswer: val })}
          hint={hint}
        />
      )}

      {mode === "teacher-lesson" && (
        <span className="text-muted-foreground">
          [Teacher Lesson - Coming Soon]
        </span>
      )}

      {mode === "teacher-editor" && (
        <span className="text-muted-foreground">
          [Teacher Editor - Coming Soon]
        </span>
      )}
    </NodeViewWrapper>
  );
}

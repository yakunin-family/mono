import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { BlankAttributes } from "./Blank";
import { StudentBlankInput } from "@/components/blank/StudentBlankInput";
import { TeacherLessonBlank } from "@/components/blank/TeacherLessonBlank";
import { validateAnswer } from "@/utils/blankValidation";

interface BlankNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: BlankAttributes };
}

export function BlankView(props: NodeViewProps) {
  const { node, editor, updateAttributes } = props as BlankNodeViewProps;

  const mode = editor.storage.editorMode;
  const { studentAnswer, hint, correctAnswer, alternativeAnswers } = node.attrs;

  const isCorrect = validateAnswer(
    studentAnswer,
    correctAnswer,
    alternativeAnswers,
  );

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
        <TeacherLessonBlank
          studentAnswer={studentAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          hint={hint}
        />
      )}

      {mode === "teacher-editor" && (
        <span className="text-muted-foreground">
          [Teacher Editor - Coming Soon]
        </span>
      )}
    </NodeViewWrapper>
  );
}

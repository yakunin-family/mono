import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import type { BlankAttributes } from "./Blank";
import { StudentBlankInput } from "@/components/blank/StudentBlankInput";
import { TeacherLessonBlank } from "@/components/blank/TeacherLessonBlank";
import { TeacherEditorBadge } from "@/components/blank/TeacherEditorBadge";
import { validateAnswer } from "@/utils/blankValidation";
import { useEditorMode } from "@/components/DocumentEditor";

interface BlankNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: BlankAttributes };
}

export function BlankView(props: NodeViewProps) {
  const { node, updateAttributes } = props as BlankNodeViewProps;

  const mode = useEditorMode();
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
        <TeacherEditorBadge
          correctAnswer={correctAnswer}
          alternativeAnswers={alternativeAnswers}
          hint={hint}
          onEdit={(newAnswer) => updateAttributes({ correctAnswer: newAnswer })}
        />
      )}
    </NodeViewWrapper>
  );
}

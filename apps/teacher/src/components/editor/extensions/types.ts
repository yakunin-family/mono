// types.ts
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeViewProps } from "@tiptap/react";

export type EditorMode = "teacher" | "student";

export type SlotAttributes = {
  id: string | null;
  placeholder: string;
  minWidth: string;
  correctAnswer: string | null;
};

export type ExerciseAttributes = {
  id: string | null;
  type: "fill-in-blank" | "multiple-choice" | "essay" | "short-answer";
};

export interface SlotNodeViewProps extends NodeViewProps {
  node: ProseMirrorNode & {
    attrs: SlotAttributes;
  };
}

export interface ExerciseNodeViewProps extends NodeViewProps {
  node: ProseMirrorNode & {
    attrs: ExerciseAttributes;
  };
}

export interface EditorModeContextType {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}

import "./styles.css";

export type { DocumentEditorProps } from "./components/DocumentEditor";
export { DocumentEditor, useEditorMode } from "./components/DocumentEditor";
export type { BlankAttributes } from "./extensions/Blank";
export { Blank } from "./extensions/Blank";
export type { ExerciseAttributes } from "./extensions/Exercise";
export { Exercise } from "./extensions/Exercise";
export type {
  ExerciseGenerationAttributes,
  ExerciseGenerationStorage,
} from "./extensions/ExerciseGeneration";
export { ExerciseGeneration } from "./extensions/ExerciseGeneration";
export { NoteBlock } from "./extensions/NoteBlock";
export type { EditorMode } from "./types";
export { getRandomUserColor, getUserColorByIndex } from "./utils/user-colors";

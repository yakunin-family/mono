import "./styles.css";

export { DocumentEditor } from "./components/DocumentEditor";
export type { DocumentEditorProps } from "./components/DocumentEditor";
export { DocumentEditorToolbar } from "./components/DocumentEditorToolbar";
export type { DocumentEditorToolbarProps } from "./components/DocumentEditorToolbar";
export { Blank } from "./extensions/Blank";
export type { BlankAttributes } from "./extensions/Blank";
export { Exercise } from "./extensions/Exercise";
export type { ExerciseAttributes } from "./extensions/Exercise";
export { ExerciseGeneration } from "./extensions/ExerciseGeneration";
export type {
  ExerciseGenerationAttributes,
  ExerciseGenerationStorage,
} from "./extensions/ExerciseGeneration";
export type { EditorMode } from "./types";
export { getRandomUserColor, getUserColorByIndex } from "./utils/user-colors";

import "./styles.css";

export type {
  DocumentEditorHandle,
  DocumentEditorProps,
} from "./components/DocumentEditor";
export { DocumentEditor, useEditorMode } from "./components/DocumentEditor";
export type { LibraryItem } from "./components/LibraryModal";
export { LibraryModal } from "./components/LibraryModal";
export type { LibraryItemType } from "./components/SaveToLibraryModal";
export { SaveToLibraryModal } from "./components/SaveToLibraryModal";
export type {
  LibraryItemWithMetadata,
  LibraryMetadata,
} from "./components/LibraryDrawer";
export { LibraryDrawer } from "./components/LibraryDrawer";
export type { SaveToLibraryData } from "./components/SaveToLibraryDrawer";
export { SaveToLibraryDrawer } from "./components/SaveToLibraryDrawer";
export {
  parseSearchQuery,
  matchesSearchQuery,
  formatLevelsDisplay,
  suggestFiltersFromText,
  type ParsedSearchQuery,
  type SearchFilters,
  type CEFRLevel,
} from "./utils/searchQueryParser";
export type { BlankAttributes } from "./extensions/Blank";
export { Blank } from "./extensions/Blank";
export type { ExerciseAttributes } from "./extensions/Exercise";
export { Exercise } from "./extensions/Exercise";
export type { GroupAttributes } from "./extensions/Group";
export { Group } from "./extensions/Group";
export type {
  ExerciseGenerationAttributes,
  ExerciseGenerationStorage,
} from "./extensions/ExerciseGeneration";
export { ExerciseGeneration } from "./extensions/ExerciseGeneration";
export { NoteBlock } from "./extensions/NoteBlock";
export type { SelectionSaveStorage } from "./extensions/SelectionSave";
export { SelectionSave } from "./extensions/SelectionSave";
export type { EditorMode } from "./types";
export { getRandomUserColor, getUserColorByIndex } from "./utils/user-colors";

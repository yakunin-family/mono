import "./styles.css";

// Re-export Editor type from tiptap for consumers
export type {
  DocumentEditorHandle,
  DocumentEditorProps,
} from "./components/DocumentEditor";
export { DocumentEditor, useEditorMode } from "./components/DocumentEditor";
export type {
  LibraryItemWithMetadata,
  LibraryMetadata,
} from "./components/LibraryDrawer";
export { LibraryDrawer } from "./components/LibraryDrawer";
export type { LibraryItem } from "./components/LibraryModal";
export { LibraryModal } from "./components/LibraryModal";
export type { SaveToLibraryData } from "./components/SaveToLibraryDrawer";
export { SaveToLibraryDrawer } from "./components/SaveToLibraryDrawer";
export type { LibraryItemType } from "./components/SaveToLibraryModal";
export { SaveToLibraryModal } from "./components/SaveToLibraryModal";
export type { BlankAttributes } from "./extensions/Blank";
export { Blank } from "./extensions/Blank";
export type {
  DocumentContextOptions,
  DocumentContextStorage,
} from "./extensions/DocumentContext";
export { DocumentContext } from "./extensions/DocumentContext";
export type { ExerciseAttributes } from "./extensions/Exercise";
export { Exercise } from "./extensions/Exercise";
export type { GroupAttributes } from "./extensions/Group";
export { Group } from "./extensions/Group";
export type { MarqueeSelectionStorage } from "./extensions/MarqueeSelection";
export {
  BlockSelection,
  MarqueeSelection,
  marqueeSelectionPluginKey,
} from "./extensions/MarqueeSelection";
export { NoteBlock } from "./extensions/NoteBlock";
export type { SelectionSaveStorage } from "./extensions/SelectionSave";
export { SelectionSave } from "./extensions/SelectionSave";
export type { EditorMode } from "./types";
export {
  type CEFRLevel,
  formatLevelsDisplay,
  matchesSearchQuery,
  type ParsedSearchQuery,
  parseSearchQuery,
  type SearchFilters,
  suggestFiltersFromText,
} from "./utils/searchQueryParser";
export { getRandomUserColor, getUserColorByIndex } from "./utils/user-colors";
export type { Editor } from "@tiptap/core";

// XML Serialization
export { applyOperations } from "./operations/executor";
export type {
  FromXMLOptions,
  ToXMLOptions,
  ValidationResult,
} from "./serialization";
export {
  fromXML,
  jsonToXML,
  toXML,
  validateXML,
  xmlToJSON,
} from "./serialization";

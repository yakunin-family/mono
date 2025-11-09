import { createContext, useContext } from "react";

export type EditorMode = "teacher" | "student";

interface EditorModeContextType {
  mode: EditorMode;
}

export const EditorModeContext = createContext<EditorModeContextType>({
  mode: "teacher",
});

export function useEditorMode() {
  return useContext(EditorModeContext);
}

import { type Editor, fromXML, validateXML } from "@package/editor";
import { useCallback } from "react";

export interface ApplyAIResponseResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for applying AI-generated document XML to the Tiptap editor
 */
export function useAIDocumentEdit(editor: Editor | null) {
  const applyAIResponse = useCallback(
    (documentXml: string): ApplyAIResponseResult => {
      if (!editor) {
        return { success: false, error: "Editor not ready" };
      }

      // Validate the XML first
      const validation = validateXML(documentXml);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Apply changes to the editor
      try {
        fromXML(editor, documentXml);
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to apply document changes";
        return { success: false, error: errorMessage };
      }
    },
    [editor],
  );

  return { applyAIResponse };
}

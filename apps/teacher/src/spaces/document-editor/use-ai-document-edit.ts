import { latest } from "@package/ai-agent";
import {
  applyOperations,
  type Editor,
  fromXML,
  validateXML,
} from "@package/editor";
import { useCallback } from "react";

export interface ApplyAIResponseResult {
  success: boolean;
  error?: string;
}

export interface ApplyOperationsResult {
  success: boolean;
  results: latest.operationTypes.OperationResult[];
  failedCount: number;
}

/**
 * Hook for applying AI-generated document changes to the Tiptap editor.
 * Supports both full XML replacement (editDocument) and surgical operations (patchDocument).
 */
export function useAIDocumentEdit(editor: Editor | null) {
  /**
   * Apply full XML replacement (for editDocument tool)
   */
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

  /**
   * Apply surgical operations (for patchDocument tool)
   */
  const applyDocumentOperations = useCallback(
    (
      operations: latest.operationTypes.DocumentOperation[],
    ): ApplyOperationsResult => {
      if (!editor) {
        return {
          success: false,
          results: [],
          failedCount: operations.length,
        };
      }

      try {
        const results = applyOperations(editor, operations);
        const failedCount = results.filter((r) => !r.success).length;

        // Log any failures for debugging
        results
          .filter((r) => !r.success)
          .forEach((r) => {
            console.error(
              `Operation failed:`,
              r.op,
              "error" in r ? r.error : "unknown error",
            );
          });

        return {
          success: failedCount === 0,
          results,
          failedCount,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to apply operations";
        console.error("applyDocumentOperations error:", errorMessage);
        return {
          success: false,
          results: [],
          failedCount: operations.length,
        };
      }
    },
    [editor],
  );

  return { applyAIResponse, applyDocumentOperations };
}

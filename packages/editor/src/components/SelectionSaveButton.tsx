import { Button } from "@package/ui";
import type { Editor } from "@tiptap/core";
import { GroupIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SelectionSaveButtonProps {
  editor: Editor;
}

interface SelectionState {
  hasMultiBlockSelection: boolean;
  selectionCoords: { top: number; left: number } | null;
}

export function SelectionSaveButton({ editor }: SelectionSaveButtonProps) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    hasMultiBlockSelection: false,
    selectionCoords: null,
  });

  useEffect(() => {
    const handleSelectionUpdate = (event: CustomEvent<SelectionState>) => {
      setSelectionState(event.detail);
    };

    window.addEventListener(
      "selectionSaveUpdate",
      handleSelectionUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        "selectionSaveUpdate",
        handleSelectionUpdate as EventListener,
      );
    };
  }, []);

  const handleGroup = useCallback(() => {
    editor.chain().focus().wrapInGroup().run();
  }, [editor]);

  const editorMode = editor.storage.editorMode;
  const isTeacherEditor = editorMode === "teacher-editor";

  if (!isTeacherEditor) {
    return null;
  }

  const { hasMultiBlockSelection, selectionCoords } = selectionState;

  if (!hasMultiBlockSelection || !selectionCoords) {
    return null;
  }

  const buttonStyle: React.CSSProperties = {
    position: "fixed",
    top: selectionCoords.top - 40,
    left: selectionCoords.left,
    zIndex: 50,
  };

  return createPortal(
    <div style={buttonStyle}>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleGroup}
        className="shadow-md"
      >
        <GroupIcon className="mr-1.5 h-4 w-4" />
        Group
      </Button>
    </div>,
    document.body,
  );
}

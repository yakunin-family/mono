import { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor, JSONContent } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ConvexReactClient } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

import type { EditorMode } from "@/types";

export interface ExerciseBankStorage {
  saveExercise?: (title: string, content: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Storage {
    exerciseBank: ExerciseBankStorage;
  }
}

import { Blank } from "../extensions/Blank";
import { BlockHover } from "../extensions/BlockHover";
import { Exercise } from "../extensions/Exercise";
import { ExerciseGeneration } from "../extensions/ExerciseGeneration";
import { Group } from "../extensions/Group";
import { NoteBlock } from "../extensions/NoteBlock";
import { SelectionSave } from "../extensions/SelectionSave";
import { SlashCommand } from "../extensions/SlashCommand";
import { WritingArea } from "../extensions/WritingArea";
import { EditorStatusBar } from "./EditorStatusBar";
import { LibraryModal, type LibraryItem } from "./LibraryModal";
import { MouseTracker } from "./MouseTracker";
import { RemoteCursors } from "./RemoteCursors";
import { SelectionSaveButton } from "./SelectionSaveButton";

interface DocumentEditorInternalProps {
  provider: HocuspocusProvider;
  ydoc: Y.Doc;
  canEdit: boolean;
  mode: EditorMode;
  status: "connecting" | "connected" | "disconnected";
  convexClient?: ConvexReactClient;
  onStartExerciseGeneration?: (
    promptText: string,
    model: string,
  ) => Promise<{ sessionId: string }>;
  onSaveExerciseToBank?: (title: string, content: string) => Promise<void>;
  onSaveGroupToLibrary?: (title: string, content: string) => Promise<void>;
  libraryItems?: LibraryItem[];
  isLoadingLibraryItems?: boolean;
  onEditorReady?: (editor: Editor) => void;
}

/**
 * Internal editor component that receives initialized provider and Y.Doc.
 * This component is not exported and should only be used by DocumentEditor.
 */
export function DocumentEditorInternal({
  provider,
  ydoc,
  canEdit,
  mode,
  status,
  convexClient,
  onStartExerciseGeneration,
  onSaveExerciseToBank,
  onSaveGroupToLibrary,
  libraryItems = [],
  isLoadingLibraryItems = false,
  onEditorReady,
}: DocumentEditorInternalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable code blocks as they're not needed
      }),
      Markdown,
      Collaboration.configure({
        document: ydoc,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Blank,
      Exercise,
      Group,
      WritingArea,
      NoteBlock,
      ExerciseGeneration,
      SlashCommand.configure({
        canEdit,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      BlockHover,
      SelectionSave,
    ],
    editable: canEdit,
    immediatelyRender: false,
  });

  // Update editability when canEdit prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  // Set exercise generation callback and Convex client in editor storage
  useEffect(() => {
    if (editor) {
      editor.storage.exerciseGeneration = {
        startGeneration: onStartExerciseGeneration,
        convexClient: convexClient,
      };
    }
  }, [editor, onStartExerciseGeneration, convexClient]);

  // Store mode in editor storage for backward compatibility
  useEffect(() => {
    if (editor) {
      editor.storage.editorMode = mode;
    }
  }, [editor, mode]);

  // Set exercise bank save callback in editor storage
  useEffect(() => {
    if (editor) {
      editor.storage.exerciseBank = {
        saveExercise: onSaveExerciseToBank,
      };
    }
  }, [editor, onSaveExerciseToBank]);

  // Set group save callback in editor storage
  useEffect(() => {
    if (editor) {
      editor.storage.groupSave = {
        saveGroup: onSaveGroupToLibrary,
      };
    }
  }, [editor, onSaveGroupToLibrary]);

  // Listen for openLibraryModal custom event
  useEffect(() => {
    const handleOpenLibraryModal = () => setLibraryModalOpen(true);
    window.addEventListener("openLibraryModal", handleOpenLibraryModal);
    return () =>
      window.removeEventListener("openLibraryModal", handleOpenLibraryModal);
  }, []);

  // Handle inserting items from the library
  const handleInsertFromLibrary = useCallback(
    (selectedIds: string[]) => {
      if (!editor) return;

      const selectedItems = libraryItems.filter((item) =>
        selectedIds.includes(item._id),
      );

      const nodes: JSONContent[] = [];

      for (const item of selectedItems) {
        const content = JSON.parse(item.content) as JSONContent[];

        if (item.type === "exercise") {
          // Wrap exercises in an exercise node
          nodes.push({
            type: "exercise",
            attrs: {
              instanceId: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
            content,
          });
        } else if (item.type === "group") {
          // Wrap groups in a group node
          nodes.push({
            type: "group",
            attrs: {
              id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
            content,
          });
        }
      }

      if (nodes.length > 0) {
        editor.chain().focus().insertContent(nodes).run();
      }
      setLibraryModalOpen(false);
    },
    [editor, libraryItems],
  );

  if (!editor) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Initializing editor...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col px-12 pt-12 pb-[30vh]"
    >
      <EditorContent
        editor={editor}
        className="[&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
      />

      <MouseTracker provider={provider} containerRef={containerRef} />
      <RemoteCursors provider={provider} />

      <EditorStatusBar status={status} editor={editor} />

      <LibraryModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
        items={libraryItems}
        isLoading={isLoadingLibraryItems}
        onInsert={handleInsertFromLibrary}
      />

      <SelectionSaveButton editor={editor} />
    </div>
  );
}

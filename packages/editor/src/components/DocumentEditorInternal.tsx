import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Image } from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import * as Y from "yjs";

import { Blank } from "../extensions/Blank";
import { Exercise } from "../extensions/Exercise";
import { ExerciseGeneration } from "../extensions/ExerciseGeneration";
import { NoteBlock } from "../extensions/NoteBlock";
import { SlashCommand } from "../extensions/SlashCommand";
import { WritingArea } from "../extensions/WritingArea";
import { EditorStatusBar } from "./EditorStatusBar";
import { MouseTracker } from "./MouseTracker";
import { RemoteCursors } from "./RemoteCursors";
import { DragHandle } from "./DragHandle";
import type { EditorMode } from "@/types";

interface DocumentEditorInternalProps {
  provider: HocuspocusProvider;
  ydoc: Y.Doc;
  canEdit: boolean;
  mode: EditorMode;
  status: "connecting" | "connected" | "disconnected";
  convexClient?: any; // ConvexReactClient from consuming app
  onStartExerciseGeneration?: (
    promptText: string,
    model: string,
  ) => Promise<{ sessionId: string }>;
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
}: DocumentEditorInternalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      WritingArea,
      NoteBlock,
      ExerciseGeneration,
      SlashCommand.configure({
        canEdit,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
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

  if (!editor) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Initializing editor...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col">
      <div className="group">
        <EditorContent
          editor={editor}
          className="py-6 [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
        />
        {canEdit && <DragHandle editor={editor} />}
      </div>

      <MouseTracker provider={provider} containerRef={containerRef} />
      <RemoteCursors provider={provider} />

      <EditorStatusBar status={status} editor={editor} />
    </div>
  );
}

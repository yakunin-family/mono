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
import { SlashCommand } from "../extensions/SlashCommand";
import { DocumentEditorToolbar } from "./DocumentEditorToolbar";
import { MouseTracker } from "./MouseTracker";
import { RemoteCursors } from "./RemoteCursors";
import { cn } from "@package/ui";
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

  // Store mode in editor storage for NodeViews to access
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
    <div ref={containerRef} className="relative flex flex-col gap-3">
      {canEdit && <DocumentEditorToolbar editor={editor} />}

      <div className="group rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        <EditorContent
          editor={editor}
          className="p-6 [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
        />
      </div>

      <StatusIndicator status={status} />

      {/* Mouse cursor tracking */}
      <MouseTracker provider={provider} containerRef={containerRef} />
      <RemoteCursors provider={provider} />
    </div>
  );
}

function StatusIndicator({
  status,
}: {
  status: "connecting" | "connected" | "disconnected";
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div
        className={cn("size-2 rounded-full transition-colors", {
          "bg-emerald-500 dark:bg-emerald-400": status === "connected",
          "bg-amber-500 dark:bg-amber-400": status === "connecting",
          "bg-red-500 dark:bg-red-400": status === "disconnected",
        })}
      />
      <span className="capitalize">{status}</span>
    </div>
  );
}

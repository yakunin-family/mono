import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Image } from "@tiptap/extension-image";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { Exercise } from "../extensions/Exercise";
import { SlashCommand } from "../extensions/SlashCommand";
import { DocumentEditorToolbar } from "./DocumentEditorToolbar";
import { cn } from "@mono/ui";

export interface DocumentEditorProps {
  documentId: string;
  canEdit?: boolean;
  websocketUrl?: string;
  token?: string;
  onStatusChange?: (
    status: "connecting" | "connected" | "disconnected",
  ) => void;
  onConnectedUsersChange?: (count: number) => void;
}

export function DocumentEditor({
  documentId,
  canEdit = true,
  websocketUrl = "ws://127.0.0.1:1234",
  token,
  onStatusChange,
  onConnectedUsersChange,
}: DocumentEditorProps) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable code blocks as they're not needed
      }),
      Collaboration.configure({
        document: new Y.Doc(),
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
      Exercise,
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

  useEffect(() => {
    if (!editor) return;

    // Get the Y.Doc from the editor
    const ydoc = editor.extensionManager.extensions.find(
      (ext) => ext.name === "collaboration",
    )?.options.document as Y.Doc;

    if (!ydoc) return;

    // Connect to the Hocuspocus server
    const provider = new HocuspocusProvider({
      url: websocketUrl,
      name: documentId,
      document: ydoc,
      token: token,
      onStatus: ({ status }) => {
        setStatus(status);
        onStatusChange?.(status);
      },
      onAwarenessUpdate: ({ states }) => {
        onConnectedUsersChange?.(states.length);
      },
    });

    return () => {
      provider.destroy();
    };
  }, [
    editor,
    documentId,
    websocketUrl,
    token,
    onStatusChange,
    onConnectedUsersChange,
  ]);

  // Update editability when canEdit prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  if (!editor) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit && <DocumentEditorToolbar editor={editor} />}

      <div className="group rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        <EditorContent
          editor={editor}
          className="p-6 [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
        />
      </div>

      <StatusIndicator status={status} />
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

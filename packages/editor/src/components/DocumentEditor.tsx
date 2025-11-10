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
      StarterKit.configure(),
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
      <div className="p-4 text-center text-gray-500">Loading editor...</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && <DocumentEditorToolbar editor={editor} />}

      <div className="rounded-lg border bg-card">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 dark:prose-invert [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
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
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div
        className={cn("size-2 rounded-full bg-gray-500", {
          "bg-green-500": status === "connected",
          "bg-yellow-500": status === "connecting",
          "bg-red-500": status === "disconnected",
        })}
      />
      <span className="capitalize">{status}</span>
    </div>
  );
}

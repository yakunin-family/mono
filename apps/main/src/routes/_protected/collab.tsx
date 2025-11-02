import { HocuspocusProvider } from "@hocuspocus/provider";
import { Button } from "@mono/ui";
import { createFileRoute } from "@tanstack/react-router";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import * as Y from "yjs";

export const Route = createFileRoute("/_protected/collab")({
  component: CollabEditorPage,
});

function CollabEditorPage() {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [connectedUsers, setConnectedUsers] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      Collaboration.configure({
        document: new Y.Doc(),
      }),
    ],
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
      url: "ws://127.0.0.1:1234",
      name: "demo-document", // This is the document ID - change per document
      document: ydoc,
      onStatus: ({ status }) => {
        setStatus(status);
      },
      onAwarenessUpdate: ({ states }) => {
        setConnectedUsers(states.length);
      },
    });

    return () => {
      provider.destroy();
    };
  }, [editor]);

  const getContent = () => {
    if (editor) {
      alert(editor.getHTML());
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaborative Editor</h1>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${getStatusColor()}`} />
              <span className="text-muted-foreground capitalize">{status}</span>
            </div>
            <div className="text-muted-foreground">
              {connectedUsers} {connectedUsers === 1 ? "user" : "users"} online
            </div>
          </div>
        </div>
        <Button onClick={getContent} variant="outline">
          Get Content
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
          <Button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            variant={editor?.isActive("bold") ? "default" : "outline"}
            size="sm"
          >
            Bold
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            variant={editor?.isActive("italic") ? "default" : "outline"}
            size="sm"
          >
            Italic
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            variant={editor?.isActive("strike") ? "default" : "outline"}
            size="sm"
          >
            Strike
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleCode().run()}
            variant={editor?.isActive("code") ? "default" : "outline"}
            size="sm"
          >
            Code
          </Button>
          <div className="w-px bg-border" />
          <Button
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            variant={
              editor?.isActive("heading", { level: 1 }) ? "default" : "outline"
            }
            size="sm"
          >
            H1
          </Button>
          <Button
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            variant={
              editor?.isActive("heading", { level: 2 }) ? "default" : "outline"
            }
            size="sm"
          >
            H2
          </Button>
          <Button
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            variant={
              editor?.isActive("heading", { level: 3 }) ? "default" : "outline"
            }
            size="sm"
          >
            H3
          </Button>
          <div className="w-px bg-border" />
          <Button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            variant={editor?.isActive("bulletList") ? "default" : "outline"}
            size="sm"
          >
            Bullet List
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            variant={editor?.isActive("orderedList") ? "default" : "outline"}
            size="sm"
          >
            Ordered List
          </Button>
          <Button
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            variant={editor?.isActive("codeBlock") ? "default" : "outline"}
            size="sm"
          >
            Code Block
          </Button>
          <div className="w-px bg-border" />
          <Button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            variant={editor?.isActive("blockquote") ? "default" : "outline"}
            size="sm"
          >
            Quote
          </Button>
          <Button
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            variant="outline"
            size="sm"
          >
            HR
          </Button>
        </div>

        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none dark:prose-invert [&_.tiptap]:min-h-[300px] [&_.tiptap]:outline-none"
        />
      </div>

      <div className="mt-4 rounded-lg border bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Open this page in multiple browser windows to test real-time
          collaboration!
        </p>
      </div>
    </div>
  );
}

import { HocuspocusProvider } from "@hocuspocus/provider";
import { Button } from "@mono/ui";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import * as Y from "yjs";

export interface LessonEditorProps {
  lessonId: string;
  canEdit: boolean;
  websocketUrl?: string;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected") => void;
  onConnectedUsersChange?: (count: number) => void;
}

export function LessonEditor({
  lessonId,
  canEdit,
  websocketUrl = "ws://127.0.0.1:1234",
  onStatusChange,
  onConnectedUsersChange,
}: LessonEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure(),
        Collaboration.configure({
          document: new Y.Doc(),
        }),
      ],
      immediatelyRender: false,
      editable: canEdit,
    },
    [canEdit],
  );

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
      name: lessonId,
      document: ydoc,
      onStatus: ({ status }) => {
        onStatusChange?.(status);
      },
      onAwarenessUpdate: ({ states }) => {
        onConnectedUsersChange?.(states.length);
      },
    });

    return () => {
      provider.destroy();
    };
  }, [editor, lessonId, websocketUrl, onStatusChange, onConnectedUsersChange]);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <LessonEditorToolbar editor={editor} canEdit={canEdit} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none dark:prose-invert [&_.tiptap]:min-h-[500px] [&_.tiptap]:outline-none"
      />
    </div>
  );
}

interface LessonEditorToolbarProps {
  editor: Editor | null;
  canEdit: boolean;
}

export function LessonEditorToolbar({
  editor,
  canEdit,
}: LessonEditorToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
      <Button
        onClick={() => editor?.chain().focus().toggleBold().run()}
        variant={editor?.isActive("bold") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
      >
        Bold
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        variant={editor?.isActive("italic") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
      >
        Italic
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        variant={editor?.isActive("strike") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
      >
        Strike
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleCode().run()}
        variant={editor?.isActive("code") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
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
        disabled={!canEdit}
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
        disabled={!canEdit}
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
        disabled={!canEdit}
      >
        H3
      </Button>
      <div className="w-px bg-border" />
      <Button
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        variant={editor?.isActive("bulletList") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
      >
        Bullet List
      </Button>
      <Button
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        variant={editor?.isActive("orderedList") ? "default" : "outline"}
        size="sm"
        disabled={!canEdit}
      >
        Ordered List
      </Button>
    </div>
  );
}

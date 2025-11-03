import { Button } from "@mono/ui";
import { createFileRoute } from "@tanstack/react-router";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

export const Route = createFileRoute("/_protected/editor")({
  component: EditorPage,
});

function EditorPage() {
  const [content, setContent] = useState("<p>Start writing...</p>");

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  const getContent = () => {
    if (editor) {
      alert(editor.getHTML());
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tiptap Editor</h1>
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
          <div className="w-px bg-border" />
          <Button
            onClick={() => editor?.chain().focus().undo().run()}
            variant="outline"
            size="sm"
            disabled={!editor?.can().undo()}
          >
            Undo
          </Button>
          <Button
            onClick={() => editor?.chain().focus().redo().run()}
            variant="outline"
            size="sm"
            disabled={!editor?.can().redo()}
          >
            Redo
          </Button>
        </div>

        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none dark:prose-invert [&_.tiptap]:min-h-[300px] [&_.tiptap]:outline-none"
        />
      </div>

      <div className="mt-4 rounded-lg border bg-muted p-4">
        <p className="mb-2 text-sm font-medium">HTML Output:</p>
        <pre className="overflow-auto text-xs">{content}</pre>
      </div>
    </div>
  );
}

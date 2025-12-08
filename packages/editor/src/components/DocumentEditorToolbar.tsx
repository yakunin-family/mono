import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  StrikethroughIcon,
  FormInput,
} from "lucide-react";
import { Button, Separator } from "@package/ui";

export interface DocumentEditorToolbarProps {
  editor: Editor;
}

export function DocumentEditorToolbar({ editor }: DocumentEditorToolbarProps) {
  const editorMode = editor.storage.editorMode;

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border bg-card p-1.5">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant="ghost"
        size="icon-sm"
        title="Bold"
        data-active={editor.isActive("bold")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <BoldIcon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant="ghost"
        size="icon-sm"
        title="Italic"
        data-active={editor.isActive("italic")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <ItalicIcon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        variant="ghost"
        size="icon-sm"
        title="Strikethrough"
        data-active={editor.isActive("strike")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <StrikethroughIcon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleCode().run()}
        variant="ghost"
        size="icon-sm"
        title="Code"
        data-active={editor.isActive("code")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <CodeIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        variant="ghost"
        size="icon-sm"
        title="Heading 1"
        data-active={editor.isActive("heading", { level: 1 })}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <Heading1Icon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant="ghost"
        size="icon-sm"
        title="Heading 2"
        data-active={editor.isActive("heading", { level: 2 })}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <Heading2Icon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant="ghost"
        size="icon-sm"
        title="Heading 3"
        data-active={editor.isActive("heading", { level: 3 })}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <Heading3Icon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant="ghost"
        size="icon-sm"
        title="Bullet List"
        data-active={editor.isActive("bulletList")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <ListIcon className="size-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant="ghost"
        size="icon-sm"
        title="Ordered List"
        data-active={editor.isActive("orderedList")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <ListOrderedIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant="ghost"
        size="icon-sm"
        title="Quote"
        data-active={editor.isActive("blockquote")}
        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
      >
        <QuoteIcon className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Button
        onClick={() => {
          const instanceId = `exercise-${Date.now()}`;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "exercise",
              attrs: { instanceId },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Exercise content here..." }],
                },
              ],
            })
            .run();
        }}
        variant="ghost"
        size="icon-sm"
        title="Add Exercise"
      >
        <span className="text-xs font-semibold">Ex</span>
      </Button>

      {editorMode === "teacher-editor" && (
        <Button
          onClick={() => {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "blank",
                attrs: {
                  blankIndex: 0,
                  correctAnswer: "",
                  alternativeAnswers: [],
                  hint: null,
                  studentAnswer: "",
                },
              })
              .run();
          }}
          disabled={!editor.can().insertContent({ type: "blank" })}
          variant="ghost"
          size="icon-sm"
          title="Insert Blank"
        >
          <FormInput className="size-4" />
        </Button>
      )}
    </div>
  );
}

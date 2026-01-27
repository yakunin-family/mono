import { Separator } from "@package/ui";
import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react";
import { useEffect, useReducer } from "react";
import { ToolbarButton } from "./toolbar-button";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const updateHandler = () => forceUpdate();

    editor.on("selectionUpdate", updateHandler);
    editor.on("transaction", updateHandler);

    return () => {
      editor.off("selectionUpdate", updateHandler);
      editor.off("transaction", updateHandler);
    };
  }, [editor]);

  return (
    <div className="z-40 flex shrink-0 flex-wrap items-center gap-0.5 border-b bg-background px-2 py-1">
      {/* Text Formatting Group */}
      <ToolbarButton
        icon={BoldIcon}
        tooltip="Bold (Ctrl+B)"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={ItalicIcon}
        tooltip="Italic (Ctrl+I)"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        tooltip="Underline (Ctrl+U)"
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings Group */}
      <ToolbarButton
        icon={Heading1Icon}
        tooltip="Heading 1"
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2Icon}
        tooltip="Heading 2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3Icon}
        tooltip="Heading 3"
        isActive={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists Group */}
      <ToolbarButton
        icon={ListIcon}
        tooltip="Bullet List"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrderedIcon}
        tooltip="Numbered List"
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      {/* Image Group - Teacher Editor Only */}
      {editor.storage.editorMode === "teacher-editor" && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <ToolbarButton
            icon={ImageIcon}
            tooltip="Insert Image"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";

              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                window.dispatchEvent(
                  new CustomEvent("uploadImage", {
                    detail: { file, editor, range: null },
                  }),
                );
              };

              input.click();
            }}
          />
        </>
      )}
    </div>
  );
}

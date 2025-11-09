import { Button } from "@mono/ui";
import { createFileRoute } from "@tanstack/react-router";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

import { EditorModeContext } from "@/components/editor/EditorModeContext";
import { EditorWrapper } from "@/components/editor/EditorWrapper";
import { Exercise } from "@/components/editor/extensions/Exercise";
import { ExerciseTaskDefinition } from "@/components/editor/extensions/ExerciseTaskDefinition";
import { Slot } from "@/components/editor/extensions/Slot";
import { SlashCommand } from "@/components/editor/SlashCommand";

export const Route = createFileRoute("/_protected/editor")({
  component: EditorPage,
});

function EditorPage() {
  const [content, setContent] = useState(`<p></p>`);
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommand,
      Slot,
      ExerciseTaskDefinition,
      Exercise,
      Placeholder.configure({
        placeholder: ({ node, editor, pos }) => {
          // Check if this paragraph is inside exerciseTaskDefinition
          if (node.type.name === "paragraph") {
            const $pos = editor.state.doc.resolve(pos);
            const parent = $pos.parent;

            if (parent.type.name === "exerciseTaskDefinition") {
              return "Define the task for this exercise...";
            }
          }

          if (node.type.name === "paragraph") {
            return "Type / for commands";
          }

          return "";
        },
      }),
    ],
    editable: viewMode === "teacher",
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  const handleChangeViewMode = (mode: "teacher" | "student") => {
    setViewMode(mode);
    if (editor) {
      editor.setEditable(mode === "teacher");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tiptap Editor</h1>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              handleChangeViewMode(
                viewMode === "teacher" ? "student" : "teacher",
              )
            }
            variant="outline"
          >
            {viewMode === "teacher"
              ? "Switch to Student View"
              : "Switch to Teacher View"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <EditorModeContext.Provider value={{ mode: viewMode }}>
          <EditorWrapper editor={editor} className="min-h-[300px]" />
        </EditorModeContext.Provider>
      </div>

      <div className="mt-4 rounded-lg border bg-muted p-4">
        <p className="mb-2 text-sm font-medium">HTML Output:</p>
        <code className="overflow-auto text-xs">{content}</code>
      </div>
    </div>
  );
}

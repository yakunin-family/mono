import "./EditorWrapper.css";

import { cn } from "@mono/ui";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { type Editor, EditorContent } from "@tiptap/react";
import { type ReactNode } from "react";

interface EditorWrapperProps {
  editor: Editor | null;
  className?: string;
  children?: ReactNode;
}

export function EditorWrapper({ editor, className }: EditorWrapperProps) {
  return (
    <>
      {editor && (
        <DragHandle editor={editor}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </DragHandle>
      )}
      <EditorContent editor={editor} className={cn(className, "editor")} />
    </>
  );
}

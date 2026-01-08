import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { html as beautifyHtml } from "js-beautify";
import { DialogContent, DialogHeader, DialogTitle } from "@package/ui";

interface DebugHtmlModalProps {
  editor: Editor | null;
}

export function DebugHtmlModal({ editor }: DebugHtmlModalProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!editor) return;

    const updateHtml = () => {
      const rawHtml = editor.getHTML();
      const formatted = beautifyHtml(rawHtml, {
        indent_size: 2,
        wrap_line_length: 80,
        preserve_newlines: true,
        max_preserve_newlines: 2,
      });
      setHtml(formatted);
    };

    updateHtml();
    editor.on("update", updateHtml);

    return () => {
      editor.off("update", updateHtml);
    };
  }, [editor]);

  return (
    <DialogContent className="max-w-4xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>Debug: HTML Output</DialogTitle>
      </DialogHeader>
      <div className="overflow-auto max-h-[60vh]">
        <pre className="rounded bg-muted p-4 text-xs font-mono">
          <code>{html}</code>
        </pre>
      </div>
    </DialogContent>
  );
}

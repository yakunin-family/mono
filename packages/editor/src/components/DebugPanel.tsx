import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { html as beautifyHtml } from "js-beautify";

interface DebugPanelProps {
  editor: Editor | null;
}

export function DebugPanel({ editor }: DebugPanelProps) {
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

    // Update initially
    updateHtml();

    // Update on every change
    editor.on("update", updateHtml);

    return () => {
      editor.off("update", updateHtml);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="mt-4 rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-muted px-4 py-2">
        <h3 className="text-sm font-semibold">Debug: HTML Output</h3>
      </div>
      <div className="p-4">
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
          <code>{html}</code>
        </pre>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Dialog, DialogTrigger, cn } from "@package/ui";
import { DebugHtmlModal } from "./DebugHtmlModal";

interface EditorStatusBarProps {
  status: "connecting" | "connected" | "disconnected";
  editor: Editor | null;
}

export function EditorStatusBar({ status, editor }: EditorStatusBarProps) {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className="z-10 flex h-6 shrink-0 items-center justify-between border-t bg-background px-3 text-xs">
      <div className="flex items-center gap-2">
        <div
          className={cn("size-2 rounded-full", {
            "bg-emerald-500": status === "connected",
            "bg-amber-500": status === "connecting",
            "bg-red-500": status === "disconnected",
          })}
        />
        <span className="text-muted-foreground capitalize">{status}</span>
      </div>

      <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
            />
          }
        >
          HTML
        </DialogTrigger>
        <DebugHtmlModal editor={editor} />
      </Dialog>
    </div>
  );
}

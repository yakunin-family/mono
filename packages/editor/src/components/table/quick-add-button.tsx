import type { Editor } from "@tiptap/core";
import { Plus } from "lucide-react";

interface QuickAddButtonProps {
  editor: Editor;
  variant: "row" | "column";
  position: { x: number; y: number };
}

export function QuickAddButton({
  editor,
  variant,
  position,
}: QuickAddButtonProps) {
  const handleClick = () => {
    if (variant === "row") {
      editor.chain().focus().addRowAfter().run();
    } else {
      editor.chain().focus().addColumnAfter().run();
    }
  };

  const isRow = variant === "row";

  return (
    <div
      className="pointer-events-auto fixed z-50 flex items-center justify-center"
      style={{
        left: `${position.x - (isRow ? 12 : 8)}px`,
        top: `${position.y - (isRow ? 4 : 12)}px`,
        width: isRow ? "24px" : "16px",
        height: isRow ? "16px" : "24px",
      }}
    >
      <button
        onClick={handleClick}
        className="flex items-center justify-center rounded-sm bg-muted/60 border border-border/50 hover:bg-accent hover:border-primary transition-colors cursor-pointer opacity-60 hover:opacity-100"
        style={{
          width: isRow ? "20px" : "16px",
          height: isRow ? "16px" : "20px",
        }}
        aria-label={variant === "row" ? "Add row" : "Add column"}
      >
        <Plus className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}

import { DragHandle as TiptapDragHandle } from "@tiptap/extension-drag-handle-react";
import { GripVertical } from "lucide-react";
import { cn } from "@package/ui";
import type { Editor } from "@tiptap/core";
import { useRef, useCallback } from "react";

interface DragHandleProps {
  editor: Editor;
}

const SCROLL_THRESHOLD = 100;
const SCROLL_SPEED = 10;

export function DragHandle({ editor }: DragHandleProps) {
  const scrollIntervalRef = useRef<number | null>(null);
  const lastMouseYRef = useRef<number>(0);

  const startAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) return;

    const scroll = () => {
      const mouseY = lastMouseYRef.current;
      const windowHeight = window.innerHeight;

      if (mouseY < SCROLL_THRESHOLD) {
        window.scrollBy(0, -SCROLL_SPEED);
      } else if (mouseY > windowHeight - SCROLL_THRESHOLD) {
        window.scrollBy(0, SCROLL_SPEED);
      }
    };

    scrollIntervalRef.current = window.setInterval(scroll, 16);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback(
    (_event: DragEvent) => {
      const updateMousePosition = (e: MouseEvent) => {
        lastMouseYRef.current = e.clientY;
      };

      document.addEventListener("dragover", updateMousePosition);
      startAutoScroll();

      const cleanup = () => {
        document.removeEventListener("dragover", updateMousePosition);
        document.removeEventListener("dragend", cleanup);
        stopAutoScroll();
      };

      document.addEventListener("dragend", cleanup);
    },
    [startAutoScroll, stopAutoScroll],
  );

  return (
    <TiptapDragHandle
      editor={editor}
      computePositionConfig={{
        placement: "left-start",
        strategy: "absolute",
      }}
      onElementDragStart={handleDragStart}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          "size-5 rounded border bg-background",
          "cursor-grab text-muted-foreground",
          "opacity-0 transition-opacity group-hover:opacity-100",
          "hover:bg-accent hover:text-accent-foreground",
          "active:cursor-grabbing",
        )}
      >
        <GripVertical className="size-3" />
      </div>
    </TiptapDragHandle>
  );
}

import type { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { MarqueeRect } from "../extensions/MarqueeSelection";

interface MarqueeOverlayProps {
  editor: Editor;
}

export function MarqueeOverlay({ editor }: MarqueeOverlayProps) {
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const storage = editor.storage.marqueeSelection;
      if (storage) {
        setIsActive(storage.isActive);
        setRect(storage.rect);
      }
    };

    const handleEnd = () => {
      setIsActive(false);
      setRect(null);
    };

    window.addEventListener("marqueeUpdate", handleUpdate);
    window.addEventListener("marqueeEnd", handleEnd);

    return () => {
      window.removeEventListener("marqueeUpdate", handleUpdate);
      window.removeEventListener("marqueeEnd", handleEnd);
    };
  }, [editor]);

  if (!isActive || !rect) return null;

  const left = Math.min(rect.startX, rect.endX);
  const top = Math.min(rect.startY, rect.endY);
  const width = Math.abs(rect.endX - rect.startX);
  const height = Math.abs(rect.endY - rect.startY);

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 rounded-sm border-2 border-primary/50 bg-primary/10"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />,
    document.body
  );
}

import { useEffect, useRef } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

interface MouseTrackerProps {
  provider: HocuspocusProvider;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * MouseTracker component tracks mouse movements within a container
 * and broadcasts the position via Yjs awareness for multiplayer cursor tracking.
 *
 * Uses percentage-based positioning for responsive layouts.
 */
export function MouseTracker({ provider, containerRef }: MouseTrackerProps) {
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isTrackingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate position as percentage (0-100) for responsiveness
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Only update if cursor is within bounds
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        provider.setAwarenessField("cursor", { x, y });
      }
    };

    const handleMouseEnter = () => {
      isTrackingRef.current = true;
    };

    const handleMouseLeave = () => {
      isTrackingRef.current = false;
      // Clear cursor position when leaving the container
      provider.setAwarenessField("cursor", null);
    };

    const container = containerRef.current;
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [provider, containerRef]);

  return null; // This is a tracking-only component with no visual output
}

import type { Node as PMNode } from "@tiptap/pm/model";

export interface MarqueeRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface BlockInfo {
  pos: number;
  node: PMNode;
  domRect: DOMRect;
}

export interface MarqueeSelectionStorage {
  isActive: boolean;
  rect: MarqueeRect | null;
}

declare module "@tiptap/core" {
  interface Storage {
    marqueeSelection: MarqueeSelectionStorage;
  }
}

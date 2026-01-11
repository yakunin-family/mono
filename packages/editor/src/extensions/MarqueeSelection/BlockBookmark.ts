import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection, TextSelection } from "@tiptap/pm/state";
import type { Mappable } from "@tiptap/pm/transform";

export class BlockBookmark {
  readonly positions: number[];

  constructor(positions: number[]) {
    this.positions = positions;
  }

  map(mapping: Mappable): BlockBookmark {
    return new BlockBookmark(
      this.positions.map((pos) => mapping.map(pos))
    );
  }

  resolve(doc: PMNode): Selection {
    // Dynamically import to avoid circular dependency
    const { BlockSelection } = require("./BlockSelection");

    const validPositions: number[] = [];
    for (const pos of this.positions) {
      try {
        if (pos >= 0 && pos < doc.content.size) {
          const node = doc.nodeAt(pos);
          if (node && node.isBlock) {
            validPositions.push(pos);
          }
        }
      } catch {
        // Position is invalid, skip
      }
    }

    if (validPositions.length > 0) {
      return new BlockSelection(doc, validPositions);
    }

    // Fall back to text selection at first attempted position or start
    const fallbackPos = Math.min(
      Math.max(0, this.positions[0] ?? 0),
      doc.content.size
    );
    return TextSelection.near(doc.resolve(fallbackPos));
  }
}

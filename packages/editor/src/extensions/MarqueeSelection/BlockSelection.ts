import type { Node as PMNode } from "@tiptap/pm/model";
import { Selection, SelectionRange, TextSelection } from "@tiptap/pm/state";
import type { Mappable } from "@tiptap/pm/transform";

import { BlockBookmark } from "./BlockBookmark";

export interface BlockSelectionJSON {
  type: string;
  blocks: number[];
}

export class BlockSelection extends Selection {
  readonly blockPositions: number[];

  constructor(doc: PMNode, blockPositions: number[]) {
    if (blockPositions.length === 0) {
      throw new Error("BlockSelection requires at least one block position");
    }

    // Sort positions to ensure consistent ordering
    const sortedPositions = [...blockPositions].sort((a, b) => a - b);

    // Create SelectionRanges for each block
    const ranges: SelectionRange[] = sortedPositions.map((pos) => {
      const $from = doc.resolve(pos);
      const node = doc.nodeAt(pos);
      if (!node) {
        throw new Error(`No node at position ${pos}`);
      }
      const $to = doc.resolve(pos + node.nodeSize);
      return new SelectionRange($from, $to);
    });

    // First range becomes the primary selection (anchor/head)
    const firstRange = ranges[0]!;
    const lastRange = ranges[ranges.length - 1]!;
    super(firstRange.$from, lastRange.$to, ranges);
    this.blockPositions = sortedPositions;
  }

  map(doc: PMNode, mapping: Mappable): Selection {
    const newPositions: number[] = [];

    for (const pos of this.blockPositions) {
      const mapped = mapping.map(pos);

      // Verify the mapped position still points to a valid block
      try {
        if (mapped >= 0 && mapped < doc.content.size) {
          const node = doc.nodeAt(mapped);
          if (node && node.isBlock) {
            newPositions.push(mapped);
          }
        }
      } catch {
        // Position is invalid after mapping, skip
      }
    }

    if (newPositions.length === 0) {
      // Fall back to text selection if all blocks were deleted
      const fallbackPos = Math.min(
        Math.max(0, mapping.map(this.from)),
        doc.content.size
      );
      return TextSelection.near(doc.resolve(fallbackPos));
    }

    return new BlockSelection(doc, newPositions);
  }

  eq(other: Selection): boolean {
    if (!(other instanceof BlockSelection)) return false;
    if (other.blockPositions.length !== this.blockPositions.length) return false;
    return this.blockPositions.every(
      (pos, i) => other.blockPositions[i] === pos
    );
  }

  toJSON(): BlockSelectionJSON {
    return {
      type: "block",
      blocks: this.blockPositions,
    };
  }

  static fromJSON(doc: PMNode, json: BlockSelectionJSON): BlockSelection {
    return new BlockSelection(doc, json.blocks);
  }

  static create(doc: PMNode, positions: number[]): BlockSelection {
    return new BlockSelection(doc, positions);
  }

  getBookmark(): BlockBookmark {
    return new BlockBookmark(this.blockPositions);
  }

  forEachBlock(callback: (node: PMNode, pos: number) => void): void {
    const doc = this.$from.doc;
    for (const pos of this.blockPositions) {
      const node = doc.nodeAt(pos);
      if (node) {
        callback(node, pos);
      }
    }
  }
}

// Register selection type for JSON serialization (undo/redo)
Selection.jsonID("block", BlockSelection);

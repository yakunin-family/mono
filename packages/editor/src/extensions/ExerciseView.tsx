import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { TrashIcon } from "lucide-react";
import { useMemo } from "react";

export function ExerciseView({ getPos, editor }: NodeViewProps) {
  // Calculate exercise number based on position in document
  const exerciseNumber = useMemo(() => {
    if (typeof getPos !== "function") return 0;

    const currentPos = getPos();
    if (currentPos === undefined) return 0;

    let count = 0;

    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === "exercise" && pos < currentPos) {
        count++;
      }
    });

    return count + 1;
  }, [editor.state.doc, getPos]);

  return (
    <NodeViewWrapper className="block group outline">
      <div className="">
        <div className="flex gap-2 items-center justify-between">
          <span className="font-semibold" contentEditable={false}>
            Exercise {exerciseNumber}
          </span>
          <div className="group-hover:opacity-100 opacity-0 transition-opacity flex gap-2">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              contentEditable={false}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="">
          <NodeViewContent className="outline-none" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

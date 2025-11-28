import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { TrashIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@package/ui";
import type { ExerciseAttributes } from "./Exercise";

interface ExerciseNodeViewProps extends NodeViewProps {
  node: NodeViewProps['node'] & { attrs: ExerciseAttributes };
}

export function ExerciseView(props: NodeViewProps) {
  const { node, getPos, editor } = props as ExerciseNodeViewProps;
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

  const handleDelete = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    editor.commands.deleteRange({
      from: pos,
      to: pos + editor.state.doc.nodeAt(pos)!.nodeSize,
    });
  };

  return (
    <NodeViewWrapper className="my-4 block group">
      <div className="rounded-lg border border-border/50 bg-accent/5 p-4 transition-all hover:border-border hover:bg-accent/10 hover:shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className="text-sm font-semibold text-foreground"
            contentEditable={false}
          >
            Exercise {exerciseNumber}
          </span>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              contentEditable={false}
              onClick={handleDelete}
              title="Delete exercise"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="text-sm">
          <NodeViewContent className="outline-none [&_.tiptap]:outline-none" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

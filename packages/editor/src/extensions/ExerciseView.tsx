import { Button } from "@package/ui";
import type { JSONContent } from "@tiptap/core";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { BookmarkPlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { SaveExerciseModal } from "../components/SaveExerciseModal";
import type { ExerciseAttributes } from "./Exercise";

interface ExerciseBankStorage {
  saveExercise?: (title: string, content: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Storage {
    exerciseBank: ExerciseBankStorage;
  }
}

interface ExerciseNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: ExerciseAttributes };
}

export function ExerciseView(props: NodeViewProps) {
  const { node, getPos, editor } = props as ExerciseNodeViewProps;
  const exerciseNumber = node.attrs.index ?? 1;

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    editor.commands.deleteRange({
      from: pos,
      to: pos + editor.state.doc.nodeAt(pos)!.nodeSize,
    });
  };

  const handleSaveToBank = async (title: string) => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const exerciseNode = editor.state.doc.nodeAt(pos);
    if (!exerciseNode) return;

    const contentNodes: JSONContent[] = [];
    exerciseNode.content.forEach((child) => {
      contentNodes.push(child.toJSON());
    });

    const contentJson = JSON.stringify(contentNodes);

    const saveToBank = editor.storage.exerciseBank?.saveExercise;

    if (saveToBank) {
      setIsSaving(true);
      try {
        await saveToBank(title, contentJson);
        setShowSaveModal(false);
      } finally {
        setIsSaving(false);
      }
    }
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
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              contentEditable={false}
              onClick={() => setShowSaveModal(true)}
              title="Save to Exercise Bank"
            >
              <BookmarkPlusIcon className="h-3.5 w-3.5" />
            </Button>
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

      <SaveExerciseModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSave={handleSaveToBank}
        isSaving={isSaving}
      />
    </NodeViewWrapper>
  );
}

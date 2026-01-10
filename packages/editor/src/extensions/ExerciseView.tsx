import { Button } from "@package/ui";
import type { JSONContent } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
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
  const { node, getPos, editor, selected } = props as ExerciseNodeViewProps;
  const exerciseNumber = node.attrs.index ?? 1;

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const { tr, doc } = editor.state;
    const nodeSelection = NodeSelection.create(doc, pos);
    editor.view.dispatch(tr.setSelection(nodeSelection));
    editor.view.focus();
  };

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
      <div
        className={`rounded-lg border bg-accent/5 p-4 transition-all hover:shadow-sm ${
          selected
            ? "border-primary ring-2 ring-primary/20"
            : "border-border/50 hover:border-border hover:bg-accent/10"
        }`}
      >
        <div
          className="mb-3 flex cursor-pointer items-center justify-between gap-2"
          contentEditable={false}
          onClick={handleSelect}
        >
          <span className="text-sm font-semibold text-foreground">
            Exercise {exerciseNumber}
          </span>
          <div
            className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
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

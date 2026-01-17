import { Badge, Button } from "@package/ui";
import type { JSONContent } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import {
  BookmarkPlusIcon,
  Check,
  ClipboardCheckIcon,
  ClipboardListIcon,
  Loader2Icon,
  RotateCcw,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";

import { SaveExerciseModal } from "../components/SaveExerciseModal";
import { useHomework } from "../hooks/useHomework";
import type { EditorMode } from "../types";
import type { ExerciseAttributes } from "./Exercise";
import { BlockSelection } from "./MarqueeSelection";

interface LibraryStorage {
  saveExercise?: (title: string, content: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Storage {
    library: LibraryStorage;
  }
}

interface ExerciseNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: ExerciseAttributes };
}

export function ExerciseView(props: NodeViewProps) {
  const { node, getPos, editor, selected } = props as ExerciseNodeViewProps;
  const exerciseNumber = node.attrs.index ?? 1;
  const instanceId = node.attrs.instanceId;

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // When BlockSelection is active, ignore the `selected` prop to avoid double highlighting.
  // The `.block-selected` decoration from MarqueeSelection handles the visual feedback.
  const isBlockSelectionActive =
    editor.state.selection instanceof BlockSelection;
  const effectiveSelected = isBlockSelectionActive ? false : selected;

  const mode = editor.storage.editorMode as EditorMode | undefined;
  const documentId = editor.storage.documentContext?.documentId as
    | string
    | undefined;
  const spaceId = editor.storage.documentContext?.spaceId as string | undefined;

  const isStudentMode = mode === "student";
  const isTeacherMode = mode === "teacher-editor" || mode === "teacher-lesson";
  const homeworkEnabled = !!spaceId && !!documentId && !!instanceId;

  const {
    homeworkStatus,
    isToggling,
    toggleHomework,
    completeHomework,
    uncompleteHomework,
    isCompletionToggling,
  } = useHomework(documentId, instanceId, homeworkEnabled);

  const isHomework = !!homeworkStatus?.homeworkId;
  const isCompleted = homeworkStatus?.isCompleted ?? false;

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

    const saveToBank = editor.storage.library?.saveExercise;

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

  const handleToggleHomework = async () => {
    await toggleHomework();
  };

  const handleToggleCompletion = async () => {
    if (isCompleted) {
      await uncompleteHomework();
    } else {
      await completeHomework();
    }
  };

  const getBorderClass = () => {
    if (!isHomework) {
      return effectiveSelected
        ? "border-primary ring-2 ring-primary/20"
        : "border-border/50 hover:border-border hover:bg-accent/10";
    }

    if (isCompleted) {
      return "border-green-400 ring-2 ring-green-200/50 bg-green-50/30 dark:bg-green-950/20";
    }

    return "border-orange-400 ring-2 ring-orange-200/50 bg-orange-50/30 dark:bg-orange-950/20";
  };

  return (
    <NodeViewWrapper
      className="my-4 block group"
      data-exercise-instance-id={instanceId}
    >
      <div
        className={`rounded-lg border bg-accent/5 p-4 transition-all hover:shadow-sm ${getBorderClass()}`}
      >
        <div
          className="mb-3 flex cursor-pointer items-center justify-between gap-2"
          contentEditable={false}
          onClick={handleSelect}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Exercise {exerciseNumber}
            </span>

            {isHomework && (
              <Badge
                variant="secondary"
                className={
                  isCompleted
                    ? "bg-green-600 text-white hover:bg-green-600"
                    : "bg-orange-500 text-white hover:bg-orange-500"
                }
              >
                {isCompleted ? (
                  <>
                    <ClipboardCheckIcon className="mr-1 h-3 w-3" />
                    Completed
                  </>
                ) : (
                  <>
                    <ClipboardListIcon className="mr-1 h-3 w-3" />
                    Homework
                  </>
                )}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Student actions - Mark Done / Undo buttons */}
            {isStudentMode && isHomework && (
              <Button
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCompletion();
                }}
                disabled={isCompletionToggling}
                className={
                  isCompleted
                    ? "border-green-600 text-green-600 hover:bg-green-50"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {isCompletionToggling ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : isCompleted ? (
                  <>
                    <RotateCcw className="mr-1 size-4" />
                    Undo
                  </>
                ) : (
                  <>
                    <Check className="mr-1 size-4" />
                    Mark Done
                  </>
                )}
              </Button>
            )}

            {/* Teacher actions - only show when in teacher mode */}
            {isTeacherMode && (
              <div
                className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                {homeworkEnabled && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={`h-6 w-6 ${
                      isHomework
                        ? "text-orange-600 hover:text-orange-700"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                    contentEditable={false}
                    onClick={handleToggleHomework}
                    disabled={isToggling}
                    title={
                      isHomework ? "Remove from homework" : "Assign as homework"
                    }
                  >
                    {isToggling ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : isHomework ? (
                      <ClipboardCheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ClipboardListIcon className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  contentEditable={false}
                  onClick={() => setShowSaveModal(true)}
                  title="Save to Library"
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
            )}
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

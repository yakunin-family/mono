import { Button } from "@package/ui";
import type { JSONContent } from "@tiptap/core";
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { BookmarkPlusIcon, Unlink2Icon } from "lucide-react";
import { useState } from "react";

import { SaveToLibraryModal } from "../components/SaveToLibraryModal";
import type { GroupAttributes } from "./Group";

interface GroupSaveStorage {
  saveGroup?: (title: string, content: string) => Promise<void>;
}

declare module "@tiptap/core" {
  interface Storage {
    groupSave: GroupSaveStorage;
  }
}

interface GroupNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: GroupAttributes };
}

export function GroupView(props: NodeViewProps) {
  const { getPos, editor } = props as GroupNodeViewProps;

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleUngroup = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .command(({ tr, dispatch }) => {
        if (dispatch) {
          const content = node.content;
          tr.replaceWith(pos, pos + node.nodeSize, content);
        }
        return true;
      })
      .run();
  };

  const handleSaveToLibrary = async (title: string) => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const groupNode = editor.state.doc.nodeAt(pos);
    if (!groupNode) return;

    const contentNodes: JSONContent[] = [];
    groupNode.content.forEach((child) => {
      contentNodes.push(child.toJSON());
    });

    const contentJson = JSON.stringify(contentNodes);
    const saveGroup = editor.storage.groupSave?.saveGroup;

    if (saveGroup) {
      setIsSaving(true);
      try {
        await saveGroup(title, contentJson);
        setShowSaveModal(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const editorMode = editor.storage.editorMode;
  const isTeacherEditor = editorMode === "teacher-editor";

  return (
    <NodeViewWrapper className="my-4 block group/group-node">
      <div className="rounded-lg border-2 border-dashed border-border/50 bg-muted/5 p-4 transition-all hover:border-border hover:bg-muted/10">
        {isTeacherEditor && (
          <div className="mb-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover/group-node:opacity-100">
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
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              contentEditable={false}
              onClick={handleUngroup}
              title="Ungroup"
            >
              <Unlink2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <NodeViewContent className="outline-none [&_.tiptap]:outline-none" />
      </div>

      <SaveToLibraryModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        type="group"
        onSave={handleSaveToLibrary}
        isSaving={isSaving}
      />
    </NodeViewWrapper>
  );
}

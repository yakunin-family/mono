// SlotComponent.tsx
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";

import { useEditorMode } from "../EditorModeContext";
import styles from "./slot.module.css";

export const SlotComponent = ({
  node,
  updateAttributes,
  getPos,
  editor,
}: NodeViewProps) => {
  const { mode } = useEditorMode();
  const { minWidth } = node.attrs;

  const isEmpty = node.content.size === 0;

  return (
    <NodeViewWrapper as="span" data-mode={mode}>
      <NodeViewContent as="div" />
    </NodeViewWrapper>
  );
};

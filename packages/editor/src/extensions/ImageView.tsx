import { Button } from "@package/ui";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Trash2 } from "lucide-react";

import { api } from "@app/backend";
import { ImageCaption } from "../components/image/image-caption";
import { ImageDisplay } from "../components/image/image-display";
import { ImagePlaceholder } from "../components/image/image-placeholder";
import type { EditorMode } from "../types";
import type { ImageAttributes } from "./image";

interface ImageNodeViewProps extends NodeViewProps {
  node: NodeViewProps["node"] & { attrs: ImageAttributes };
}

export function ImageView(props: NodeViewProps) {
  const { node, getPos, editor, updateAttributes } =
    props as ImageNodeViewProps;
  const { storageId, caption, alt } = node.attrs;

  const mode = editor.storage.editorMode as EditorMode | undefined;
  const isTeacherEditor = mode === "teacher-editor";

  const { data, isPending, error, refetch } = useQuery(
    convexQuery(api.images.getImageUrl, { storageId }),
  );

  const handleDelete = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    editor.commands.deleteRange({
      from: pos,
      to: pos + editor.state.doc.nodeAt(pos)!.nodeSize,
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    updateAttributes({ caption: newCaption || null });
  };

  const handleAltChange = (newAlt: string) => {
    updateAttributes({ alt: newAlt || null });
  };

  return (
    <NodeViewWrapper as="div" className="my-4 block group">
      <div className="relative rounded-lg border border-border bg-card p-4">
        {isPending && <ImagePlaceholder state="loading" />}

        {error && <ImagePlaceholder state="error" onRetry={() => refetch()} />}

        {data?.url && (
          <>
            <ImageDisplay url={data.url} alt={alt} caption={caption} />

            <ImageCaption
              caption={caption}
              alt={alt}
              editable={isTeacherEditor}
              onCaptionChange={handleCaptionChange}
              onAltChange={handleAltChange}
            />
          </>
        )}

        {isTeacherEditor && (
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              contentEditable={false}
              onClick={handleDelete}
              title="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

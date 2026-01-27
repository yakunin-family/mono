import { Input } from "@package/ui";
import { useState } from "react";

interface ImageCaptionProps {
  caption: string | null;
  alt: string | null;
  editable: boolean;
  onCaptionChange?: (caption: string) => void;
  onAltChange?: (alt: string) => void;
}

export function ImageCaption({
  caption,
  alt,
  editable,
  onCaptionChange,
  onAltChange,
}: ImageCaptionProps) {
  const [localCaption, setLocalCaption] = useState(caption || "");
  const [localAlt, setLocalAlt] = useState(alt || "");

  const handleCaptionBlur = () => {
    if (onCaptionChange && localCaption !== caption) {
      onCaptionChange(localCaption || "");
    }
  };

  const handleAltBlur = () => {
    if (onAltChange && localAlt !== alt) {
      onAltChange(localAlt || "");
    }
  };

  if (!editable) {
    return caption ? (
      <p className="mt-2 text-center text-sm text-muted-foreground italic">
        {caption}
      </p>
    ) : null;
  }

  return (
    <div className="mt-3 space-y-2">
      <Input
        type="text"
        placeholder="Add a caption..."
        value={localCaption}
        onChange={(e) => setLocalCaption(e.target.value)}
        onBlur={handleCaptionBlur}
        className="text-sm"
      />
      <Input
        type="text"
        placeholder="Alt text (for accessibility)..."
        value={localAlt}
        onChange={(e) => setLocalAlt(e.target.value)}
        onBlur={handleAltBlur}
        className="text-sm"
      />
    </div>
  );
}

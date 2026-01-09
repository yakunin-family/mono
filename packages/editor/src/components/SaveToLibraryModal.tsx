import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from "@package/ui";
import { useState, useEffect } from "react";

export type LibraryItemType = "exercise" | "template" | "group";

interface SaveToLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: LibraryItemType;
  onSave: (title: string, description?: string) => void;
  isSaving?: boolean;
}

const TYPE_LABELS: Record<LibraryItemType, string> = {
  exercise: "Exercise",
  template: "Template",
  group: "Group",
};

const TYPE_DESCRIPTIONS: Record<LibraryItemType, string> = {
  exercise: "Save this exercise to your library for reuse in other documents.",
  template: "Save this as a template with a description for easy reference.",
  group: "Save this group of blocks to your library for reuse in other documents.",
};

function getTypeBadgeClassName(type: LibraryItemType): string {
  switch (type) {
    case "exercise":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "template":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "group":
      return "bg-orange-100 text-orange-800 border-orange-200";
  }
}

export function SaveToLibraryModal({
  open,
  onOpenChange,
  type,
  onSave,
  isSaving,
}: SaveToLibraryModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const handleSave = () => {
    if (title.trim()) {
      const desc = type === "template" && description.trim() ? description.trim() : undefined;
      onSave(title.trim(), desc);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Save to Library</DialogTitle>
            <Badge
              variant="outline"
              className={getTypeBadgeClassName(type)}
            >
              {TYPE_LABELS[type]}
            </Badge>
          </div>
          <DialogDescription>
            {TYPE_DESCRIPTIONS[type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder={`${TYPE_LABELS[type]} title...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim() && type !== "template") {
                handleSave();
              }
            }}
            autoFocus
          />

          {type === "template" && (
            <Textarea
              placeholder="Description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

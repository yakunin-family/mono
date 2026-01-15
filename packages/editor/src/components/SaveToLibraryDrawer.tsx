import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Textarea,
} from "@package/ui";
import { Loader2Icon, XIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import type { CEFRLevel } from "../utils/searchQueryParser";

export type LibraryItemType = "exercise" | "template" | "group";

export interface LibraryMetadata {
  language?: string;
  levels?: CEFRLevel[];
  topic?: string;
  exerciseTypes?: string[];
  tags?: string[];
  autoTagged?: boolean;
}

export interface SaveToLibraryData {
  title: string;
  description?: string;
  metadata?: LibraryMetadata;
}

interface SaveToLibraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: LibraryItemType;
  contentForTagging?: string;
  onSave: (data: SaveToLibraryData) => void;
  onAutoTag?: (content: string) => Promise<LibraryMetadata>;
  isSaving?: boolean;
}

const TYPE_LABELS: Record<LibraryItemType, string> = {
  exercise: "Exercise",
  template: "Template",
  group: "Group",
};

const TYPE_DESCRIPTIONS: Record<LibraryItemType, string> = {
  exercise:
    "Save this exercise to your library for reuse in other documents.",
  template: "Save this as a template with a description for easy reference.",
  group:
    "Save this group of blocks to your library for reuse in other documents.",
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

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const COMMON_LANGUAGES = [
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Dutch",
  "Russian",
  "Japanese",
  "Chinese",
  "Korean",
  "English",
];

export function SaveToLibraryDrawer({
  open,
  onOpenChange,
  type,
  contentForTagging,
  onSave,
  onAutoTag,
  isSaving,
}: SaveToLibraryDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [autoTagEnabled, setAutoTagEnabled] = useState(true);
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  // Metadata fields
  const [language, setLanguage] = useState<string>("");
  const [selectedLevels, setSelectedLevels] = useState<Set<CEFRLevel>>(
    new Set(),
  );
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setLanguage("");
      setSelectedLevels(new Set());
      setTopic("");
      setTags([]);
      setTagInput("");
      setIsAutoTagging(false);
    }
  }, [open]);

  // Auto-tag when drawer opens with content
  const runAutoTag = useCallback(async () => {
    if (!contentForTagging || !onAutoTag || !autoTagEnabled) return;

    setIsAutoTagging(true);
    try {
      const metadata = await onAutoTag(contentForTagging);

      // Populate fields with AI results
      if (metadata.language) setLanguage(metadata.language);
      if (metadata.levels && metadata.levels.length > 0) {
        setSelectedLevels(new Set(metadata.levels));
      }
      if (metadata.topic) setTopic(metadata.topic);
      if (metadata.tags && metadata.tags.length > 0) {
        setTags(metadata.tags);
      }
    } catch (error) {
      console.error("Auto-tagging failed:", error);
    } finally {
      setIsAutoTagging(false);
    }
  }, [contentForTagging, onAutoTag, autoTagEnabled]);

  // Trigger auto-tag when drawer opens
  useEffect(() => {
    if (open && autoTagEnabled && contentForTagging && onAutoTag) {
      runAutoTag();
    }
  }, [open, autoTagEnabled, contentForTagging, onAutoTag, runAutoTag]);

  const toggleLevel = (level: CEFRLevel) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const metadata: LibraryMetadata = {};

    if (language) metadata.language = language;
    if (selectedLevels.size > 0)
      metadata.levels = Array.from(selectedLevels).sort(
        (a, b) => CEFR_LEVELS.indexOf(a) - CEFR_LEVELS.indexOf(b),
      );
    if (topic) metadata.topic = topic;
    if (tags.length > 0) metadata.tags = tags;
    metadata.autoTagged = autoTagEnabled;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      metadata: Object.keys(metadata).length > 1 ? metadata : undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[400px] flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>Save to Library</SheetTitle>
            <Badge variant="outline" className={getTypeBadgeClassName(type)}>
              {TYPE_LABELS[type]}
            </Badge>
          </div>
          <SheetDescription>{TYPE_DESCRIPTIONS[type]}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={`${TYPE_LABELS[type]} title...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Auto-tag toggle */}
          {onAutoTag && (
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Label htmlFor="auto-tag" className="font-medium">
                  AI Auto-tagging
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically analyze content for metadata
                </p>
              </div>
              <Switch
                id="auto-tag"
                checked={autoTagEnabled}
                onCheckedChange={setAutoTagEnabled}
              />
            </div>
          )}

          {isAutoTagging && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2Icon className="size-4 animate-spin" />
              Analyzing content...
            </div>
          )}

          {/* Metadata Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Metadata</h4>

            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "")}>
                <SelectTrigger>
                  <SelectValue>Select language...</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {COMMON_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Levels */}
            <div className="space-y-2">
              <Label>CEFR Level(s)</Label>
              <div className="flex flex-wrap gap-1.5">
                {CEFR_LEVELS.map((level) => (
                  <Badge
                    key={level}
                    variant={selectedLevels.has(level) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleLevel(level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more levels. Multiple levels show as a range.
              </p>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., food, travel, business"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <XIcon className="size-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="Add tag and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Grammar focus, vocabulary themes, skill areas
              </p>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving || isAutoTagging}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@package/ui";
import { CheckIcon, FileTextIcon, SearchIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { LibraryItemType } from "./SaveToLibraryModal";

export interface LibraryItem {
  _id: string;
  title: string;
  type: LibraryItemType;
  content: string;
  description?: string;
  createdAt: number;
}

type FilterType = "all" | "exercise" | "group";

interface LibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LibraryItem[];
  isLoading: boolean;
  onInsert: (selectedIds: string[]) => void;
  excludeTemplates?: boolean;
}

const TYPE_LABELS: Record<LibraryItemType, string> = {
  exercise: "Exercise",
  template: "Template",
  group: "Group",
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

export function LibraryModal({
  open,
  onOpenChange,
  items,
  isLoading,
  onInsert,
  excludeTemplates = true,
}: LibraryModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setFilter("all");
      setSearchQuery("");
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (excludeTemplates) {
      result = result.filter((item) => item.type !== "template");
    }

    if (filter !== "all") {
      result = result.filter((item) => item.type === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, filter, searchQuery, excludeTemplates]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleInsert = () => {
    onInsert(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert from Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(value) => value && setFilter(value as FilterType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue>Filter by type</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="exercise">Exercises</SelectItem>
              <SelectItem value="group">Groups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto max-h-96 py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <FileTextIcon className="mx-auto mb-2 size-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || filter !== "all"
                  ? "No items match your search criteria."
                  : "No items in your library yet."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => toggleSelection(item._id)}
                className={`flex items-center gap-3 rounded border p-3 cursor-pointer transition-colors ${
                  selected.has(item._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selected.has(item._id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {selected.has(item._id) && <CheckIcon className="h-3 w-3" />}
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 ${getTypeBadgeClassName(item.type)}`}
                >
                  {TYPE_LABELS[item.type]}
                </Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={selected.size === 0}>
            Insert{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

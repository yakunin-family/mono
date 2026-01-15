import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@package/ui";
import {
  CheckIcon,
  FileTextIcon,
  SearchIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  type CEFRLevel,
  formatLevelsDisplay,
  matchesSearchQuery,
  parseSearchQuery,
  type SearchFilters,
  suggestFiltersFromText,
} from "../utils/searchQueryParser";

export type LibraryItemType = "exercise" | "template" | "group";

export interface LibraryMetadata {
  language?: string;
  levels?: CEFRLevel[];
  topic?: string;
  exerciseTypes?: string[];
  tags?: string[];
  autoTagged?: boolean;
}

export interface LibraryItemWithMetadata {
  _id: string;
  title: string;
  type: LibraryItemType;
  content: string;
  description?: string;
  metadata?: LibraryMetadata;
  createdAt: number;
}

type FilterType = "all" | "exercise" | "group" | "template";
type SearchMode = "structured" | "natural";

interface LibraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: LibraryItemWithMetadata[];
  isLoading: boolean;
  onInsert: (selectedIds: string[]) => void;
  onDelete?: (itemId: string) => void;
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

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function LibraryDrawer({
  open,
  onOpenChange,
  items,
  isLoading,
  onInsert,
  excludeTemplates = true,
}: LibraryDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchMode, setSearchMode] = useState<SearchMode>("structured");
  const [searchQuery, setSearchQuery] = useState("");

  // Structured mode filters
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [levelFilters, setLevelFilters] = useState<Set<CEFRLevel>>(new Set());

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setSearchQuery("");
      setTypeFilter("all");
      setLanguageFilter("all");
      setLevelFilters(new Set());
    }
  }, [open]);

  // Get unique languages from items
  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>();
    items.forEach((item) => {
      if (item.metadata?.language) {
        languages.add(item.metadata.language);
      }
    });
    return Array.from(languages).sort();
  }, [items]);

  // Parse search query for natural mode
  const parsedQuery = useMemo(
    () => parseSearchQuery(searchQuery),
    [searchQuery],
  );

  // Suggestions for natural mode
  const suggestions = useMemo(() => {
    if (searchMode !== "natural" || !searchQuery.trim()) return [];
    return suggestFiltersFromText(searchQuery);
  }, [searchMode, searchQuery]);

  // Filter items based on mode
  const filteredItems = useMemo(() => {
    let result = items;

    // Exclude templates if requested
    if (excludeTemplates) {
      result = result.filter((item) => item.type !== "template");
    }

    if (searchMode === "natural") {
      // Natural language mode - use parsed query
      result = result.filter((item) => matchesSearchQuery(item, parsedQuery));
    } else {
      // Structured mode - use individual filters
      if (typeFilter !== "all") {
        result = result.filter((item) => item.type === typeFilter);
      }

      if (languageFilter !== "all") {
        result = result.filter(
          (item) => item.metadata?.language === languageFilter,
        );
      }

      if (levelFilters.size > 0) {
        result = result.filter((item) => {
          const itemLevels = item.metadata?.levels ?? [];
          return Array.from(levelFilters).some((level) =>
            itemLevels.includes(level),
          );
        });
      }

      // Text search in structured mode
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.metadata?.topic?.toLowerCase().includes(query) ||
            item.metadata?.tags?.some((t) => t.toLowerCase().includes(query)),
        );
      }
    }

    return result;
  }, [
    items,
    excludeTemplates,
    searchMode,
    parsedQuery,
    typeFilter,
    languageFilter,
    levelFilters,
    searchQuery,
  ]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleLevelFilter = (level: CEFRLevel) => {
    const newLevels = new Set(levelFilters);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setLevelFilters(newLevels);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setLanguageFilter("all");
    setLevelFilters(new Set());
  };

  const handleInsert = () => {
    onInsert(Array.from(selected));
    onOpenChange(false);
  };

  const addSuggestionAsFilter = (filter: string, value: string) => {
    // Remove the suggestion text from search query and add as structured filter
    setSearchMode("structured");
    setSearchQuery("");

    switch (filter) {
      case "language":
        setLanguageFilter(value);
        break;
      case "level":
        setLevelFilters((prev) => new Set([...prev, value as CEFRLevel]));
        break;
      case "type":
        setTypeFilter(value as FilterType);
        break;
    }
  };

  const hasActiveFilters =
    typeFilter !== "all" ||
    languageFilter !== "all" ||
    levelFilters.size > 0 ||
    searchQuery.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:max-w-[450px] flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Library</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSearchMode((m) =>
                  m === "structured" ? "natural" : "structured",
                )
              }
              className="text-xs gap-1"
            >
              {searchMode === "structured" ? (
                <>
                  <ToggleLeftIcon className="size-4" />
                  Natural
                </>
              ) : (
                <>
                  <ToggleRightIcon className="size-4" />
                  Structured
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={
              searchMode === "natural"
                ? "german a1 dative exercises..."
                : "Search by title, topic, or tags..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Natural Mode Suggestions */}
        {searchMode === "natural" && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            <span className="text-xs text-muted-foreground">Suggestions:</span>
            {suggestions.map((s, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer hover:bg-muted text-xs"
                onClick={() => addSuggestionAsFilter(s.filter, s.value)}
              >
                {s.display}
              </Badge>
            ))}
          </div>
        )}

        {/* Structured Mode Filters */}
        {searchMode === "structured" && (
          <div className="flex flex-wrap gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => v && setTypeFilter(v as FilterType)}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue>Type</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                {!excludeTemplates && (
                  <SelectItem value="template">Template</SelectItem>
                )}
              </SelectContent>
            </Select>

            {uniqueLanguages.length > 0 && (
              <Select value={languageFilter} onValueChange={(v) => v && setLanguageFilter(v)}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue>Language</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Level Multi-Select as Chips */}
            <div className="flex flex-wrap gap-1">
              {CEFR_LEVELS.map((level) => (
                <Badge
                  key={level}
                  variant={levelFilters.has(level) ? "default" : "outline"}
                  className="cursor-pointer text-xs h-8 px-2"
                  onClick={() => toggleLevelFilter(level)}
                >
                  {level}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Active:</span>
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                {typeFilter}
                <XIcon
                  className="size-3 cursor-pointer"
                  onClick={() => setTypeFilter("all")}
                />
              </Badge>
            )}
            {languageFilter !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1">
                {languageFilter}
                <XIcon
                  className="size-3 cursor-pointer"
                  onClick={() => setLanguageFilter("all")}
                />
              </Badge>
            )}
            {levelFilters.size > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                {formatLevelsDisplay(Array.from(levelFilters))}
                <XIcon
                  className="size-3 cursor-pointer"
                  onClick={() => setLevelFilters(new Set())}
                />
              </Badge>
            )}
            {searchQuery.trim() && (
              <Badge variant="secondary" className="text-xs gap-1">
                "{searchQuery}"
                <XIcon
                  className="size-3 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <FileTextIcon className="mx-auto mb-2 size-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "No items match your filters."
                  : "No items in your library yet."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item._id}
                onClick={() => toggleSelection(item._id)}
                className={`rounded border p-3 cursor-pointer transition-colors ${
                  selected.has(item._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border mt-0.5 ${
                      selected.has(item._id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selected.has(item._id) && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {item.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${getTypeBadgeClassName(item.type)}`}
                      >
                        {TYPE_LABELS[item.type]}
                      </Badge>
                    </div>

                    {/* Metadata row */}
                    {item.metadata && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        {item.metadata.language && (
                          <span>{item.metadata.language}</span>
                        )}
                        {item.metadata.levels &&
                          item.metadata.levels.length > 0 && (
                            <>
                              <span>·</span>
                              <span>
                                {formatLevelsDisplay(item.metadata.levels)}
                              </span>
                            </>
                          )}
                        {item.metadata.topic && (
                          <>
                            <span>·</span>
                            <span>{item.metadata.topic}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {item.metadata?.tags && item.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.metadata.tags.slice(0, 4).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {item.metadata.tags.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{item.metadata.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleInsert} disabled={selected.size === 0}>
            Insert{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

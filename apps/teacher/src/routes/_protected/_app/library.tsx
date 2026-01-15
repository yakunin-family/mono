import { api } from "@app/backend";
import {
  type CEFRLevel,
  formatLevelsDisplay,
  type LibraryItemWithMetadata,
  matchesSearchQuery,
  parseSearchQuery,
  suggestFiltersFromText,
} from "@package/editor";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import {
  FileTextIcon,
  LayoutTemplateIcon,
  ListIcon,
  SearchIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_protected/_app/library")({
  component: LibraryPage,
});

type LibraryItemType = "exercise" | "group" | "template";
type FilterType = "all" | LibraryItemType;
type SearchMode = "structured" | "natural";

const typeBadgeColors: Record<LibraryItemType, string> = {
  exercise: "bg-blue-100 text-blue-800 border-blue-200",
  group: "bg-orange-100 text-orange-800 border-orange-200",
  template: "bg-purple-100 text-purple-800 border-purple-200",
};

const typeLabels: Record<LibraryItemType, string> = {
  exercise: "Exercise",
  group: "Group",
  template: "Template",
};

const typeIcons: Record<LibraryItemType, React.ReactNode> = {
  exercise: <FileTextIcon className="size-5 text-muted-foreground" />,
  group: <ListIcon className="size-5 text-muted-foreground" />,
  template: <LayoutTemplateIcon className="size-5 text-muted-foreground" />,
};

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function LibraryPage() {
  const convex = useConvex();
  const queryClient = useQueryClient();

  // Search state
  const [searchMode, setSearchMode] = useState<SearchMode>("structured");
  const [searchQuery, setSearchQuery] = useState("");

  // Structured mode filters
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [levelFilters, setLevelFilters] = useState<Set<CEFRLevel>>(new Set());

  // Fetch all items (we filter client-side for flexibility)
  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      return await convex.query(api.exerciseBank.getMyItems, {});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await convex.mutation(api.exerciseBank.deleteItem, {
        itemId: itemId as never,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  // Get unique languages from items
  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>();
    libraryQuery.data?.forEach((item) => {
      if (item.metadata?.language) {
        languages.add(item.metadata.language);
      }
    });
    return Array.from(languages).sort();
  }, [libraryQuery.data]);

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

  // Filter items
  const filteredItems = useMemo(() => {
    let result = (libraryQuery.data ?? []) as LibraryItemWithMetadata[];

    if (searchMode === "natural") {
      result = result.filter((item) => matchesSearchQuery(item, parsedQuery));
    } else {
      // Structured mode
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

      // Text search
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
    libraryQuery.data,
    searchMode,
    parsedQuery,
    typeFilter,
    languageFilter,
    levelFilters,
    searchQuery,
  ]);

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

  const addSuggestionAsFilter = (filter: string, value: string) => {
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
    <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Library</h1>
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
                  Natural Search
                </>
              ) : (
                <>
                  <ToggleRightIcon className="size-4" />
                  Structured
                </>
              )}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="rounded-lg border bg-background p-4 space-y-3">
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
                <span className="text-xs text-muted-foreground">
                  Suggestions:
                </span>
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
                  onValueChange={(v) => setTypeFilter(v as FilterType)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>

                {uniqueLanguages.length > 0 && (
                  <Select
                    value={languageFilter}
                    onValueChange={setLanguageFilter}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Language" />
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

                {/* Level Chips */}
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

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Active:</span>
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    {typeLabels[typeFilter]}
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
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            {hasActiveFilters &&
              ` (filtered from ${libraryQuery.data?.length ?? 0})`}
          </div>

          {/* Item List */}
          <div className="rounded-lg border bg-background">
            {libraryQuery.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">
                Loading items...
              </p>
            ) : libraryQuery.error ? (
              <p className="p-6 text-sm text-red-600">Error loading items</p>
            ) : filteredItems.length > 0 ? (
              <div className="divide-y">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start gap-3 p-4 hover:bg-muted/50"
                  >
                    {typeIcons[item.type]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{item.title}</h3>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${typeBadgeColors[item.type]}`}
                        >
                          {typeLabels[item.type]}
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
                                  {formatLevelsDisplay(
                                    item.metadata.levels as CEFRLevel[],
                                  )}
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
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.metadata.tags.slice(0, 5).map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.metadata.tags.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                              +{item.metadata.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Saved: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item._id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileTextIcon className="mx-auto mb-3 size-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No items match your filters."
                    : "No saved items yet. Save exercises, groups, or templates from documents to build your library."}
                </p>
              </div>
            )}
          </div>
        </div>
    </main>
  );
}

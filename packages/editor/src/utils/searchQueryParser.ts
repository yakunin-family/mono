/**
 * Search Query Parser for Library
 *
 * Supports filter syntax like:
 * - "german food level:a1"
 * - "language:german level:a1-b1 tag:dative"
 * - "vocab level:a1 level:a2 tag:grammar tag:vocab"
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface ParsedSearchQuery {
  /** Free text search (everything not a filter) */
  text: string;
  /** Structured filters */
  filters: SearchFilters;
}

export interface SearchFilters {
  language?: string;
  levels?: CEFRLevel[];
  topic?: string;
  type?: string;
  tags?: string[];
}

/**
 * Expand a level range like "a1-b1" to ["A1", "A2", "B1"]
 */
function expandLevelRange(value: string): CEFRLevel[] {
  const normalized = value.toUpperCase();

  // Check if it's a range (e.g., "A1-B1")
  const rangeMatch = normalized.match(/^([ABC][12])-([ABC][12])$/);
  if (rangeMatch) {
    const start = rangeMatch[1] as CEFRLevel;
    const end = rangeMatch[2] as CEFRLevel;

    const startIdx = CEFR_LEVELS.indexOf(start);
    const endIdx = CEFR_LEVELS.indexOf(end);

    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      return CEFR_LEVELS.slice(startIdx, endIdx + 1);
    }
  }

  // Single level
  if (CEFR_LEVELS.includes(normalized as CEFRLevel)) {
    return [normalized as CEFRLevel];
  }

  return [];
}

/**
 * Parse a search query string into structured filters and free text
 *
 * @example
 * parseSearchQuery("german food level:a1")
 * // { text: "german food", filters: { levels: ["A1"] } }
 *
 * @example
 * parseSearchQuery("language:german level:a1-b1 tag:dative")
 * // { text: "", filters: { language: "german", levels: ["A1", "A2", "B1"], tags: ["dative"] } }
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const filters: SearchFilters = {};
  let text = query;

  // Regex to match filter:value patterns (supports quoted values)
  const filterRegex = /(\w+):("[^"]+"|[\w-]+)/g;
  let match;

  while ((match = filterRegex.exec(query)) !== null) {
    const [fullMatch, key, rawValue] = match;
    if (!key || !rawValue) continue;

    // Remove quotes if present
    const value = rawValue.replace(/^"|"$/g, "");

    switch (key.toLowerCase()) {
      case "language":
      case "lang":
        filters.language = value;
        break;

      case "level":
        const levels = expandLevelRange(value);
        if (levels.length > 0) {
          filters.levels = filters.levels
            ? [...new Set([...filters.levels, ...levels])]
            : levels;
        }
        break;

      case "topic":
        filters.topic = value;
        break;

      case "type":
        filters.type = value;
        break;

      case "tag":
        filters.tags = filters.tags
          ? [...filters.tags, value.toLowerCase()]
          : [value.toLowerCase()];
        break;
    }

    // Remove matched filter from text
    text = text.replace(fullMatch, "").trim();
  }

  // Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim();

  return { text, filters };
}

/**
 * Format levels array for display
 * Single level: "A1"
 * Multiple consecutive: "A1-B1"
 * Non-consecutive: "A1, B2"
 */
export function formatLevelsDisplay(levels: CEFRLevel[]): string {
  if (levels.length === 0) return "";
  if (levels.length === 1) return levels[0]!;

  // Sort levels by CEFR order
  const sorted = [...levels].sort(
    (a, b) => CEFR_LEVELS.indexOf(a) - CEFR_LEVELS.indexOf(b),
  );

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  // Check if they're consecutive
  const startIdx = CEFR_LEVELS.indexOf(first);
  const endIdx = CEFR_LEVELS.indexOf(last);
  const expectedLength = endIdx - startIdx + 1;

  if (sorted.length === expectedLength) {
    // Consecutive range
    return `${first}-${last}`;
  }

  // Non-consecutive, show as list
  return sorted.join(", ");
}

export interface LibraryItemForFilter {
  title: string;
  description?: string;
  type: string;
  metadata?: {
    language?: string;
    levels?: CEFRLevel[];
    topic?: string;
    exerciseTypes?: string[];
    tags?: string[];
  };
}

/**
 * Check if a library item matches the parsed search query
 */
export function matchesSearchQuery(
  item: LibraryItemForFilter,
  parsed: ParsedSearchQuery,
): boolean {
  const { filters, text } = parsed;

  // Text search (case-insensitive, matches title, description, or tags)
  if (text) {
    const searchLower = text.toLowerCase();
    const matchesText =
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.metadata?.tags?.some((t) =>
        t.toLowerCase().includes(searchLower),
      ) ||
      item.metadata?.topic?.toLowerCase().includes(searchLower);

    if (!matchesText) return false;
  }

  // Language filter
  if (filters.language) {
    if (
      item.metadata?.language?.toLowerCase() !== filters.language.toLowerCase()
    ) {
      return false;
    }
  }

  // Level filter (item must have at least one matching level)
  if (filters.levels && filters.levels.length > 0) {
    const itemLevels = item.metadata?.levels ?? [];
    const hasMatchingLevel = filters.levels.some((level) =>
      itemLevels.includes(level),
    );
    if (!hasMatchingLevel) return false;
  }

  // Topic filter
  if (filters.topic) {
    if (
      !item.metadata?.topic?.toLowerCase().includes(filters.topic.toLowerCase())
    ) {
      return false;
    }
  }

  // Type filter (library item type: exercise, group, template)
  if (filters.type) {
    if (item.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }
  }

  // Tag filter (item must have all specified tags)
  if (filters.tags && filters.tags.length > 0) {
    const itemTags =
      item.metadata?.tags?.map((t) => t.toLowerCase()) ?? [];
    const hasAllTags = filters.tags.every((tag) => itemTags.includes(tag));
    if (!hasAllTags) return false;
  }

  return true;
}

/**
 * Suggest filters from natural language input
 * Returns suggestions that can be added as structured filters
 */
export function suggestFiltersFromText(
  text: string,
): Array<{ filter: string; value: string; display: string }> {
  const suggestions: Array<{ filter: string; value: string; display: string }> =
    [];
  const words = text.toLowerCase().split(/\s+/);

  // Common language names
  const languagePatterns: Record<string, string> = {
    german: "German",
    spanish: "Spanish",
    french: "French",
    italian: "Italian",
    portuguese: "Portuguese",
    dutch: "Dutch",
    russian: "Russian",
    japanese: "Japanese",
    chinese: "Chinese",
    korean: "Korean",
    english: "English",
  };

  // Check for CEFR levels
  const levelPatterns: Record<string, string> = {
    a1: "A1",
    a2: "A2",
    b1: "B1",
    b2: "B2",
    c1: "C1",
    c2: "C2",
    beginner: "A1",
    beginners: "A1",
    elementary: "A2",
    intermediate: "B1",
    "upper-intermediate": "B2",
    advanced: "C1",
  };

  // Check for exercise types
  const typePatterns: Record<string, string> = {
    exercise: "exercise",
    exercises: "exercise",
    template: "template",
    templates: "template",
    group: "group",
    groups: "group",
  };

  for (const word of words) {
    // Language detection
    if (languagePatterns[word]) {
      suggestions.push({
        filter: "language",
        value: languagePatterns[word],
        display: `language:${languagePatterns[word].toLowerCase()}`,
      });
    }

    // Level detection
    if (levelPatterns[word]) {
      suggestions.push({
        filter: "level",
        value: levelPatterns[word],
        display: `level:${levelPatterns[word].toLowerCase()}`,
      });
    }

    // Type detection
    if (typePatterns[word]) {
      suggestions.push({
        filter: "type",
        value: typePatterns[word],
        display: `type:${typePatterns[word]}`,
      });
    }
  }

  // Dedupe suggestions
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    const key = `${s.filter}:${s.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

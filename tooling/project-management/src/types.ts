/**
 * Entity prefixes for unified file naming
 */
export type EntityPrefix = "t" | "d" | "i";

/**
 * Task status representing the current state of a task
 */
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

/**
 * Task priority level
 */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Parsed filename information
 */
export interface ParsedFilename {
  prefix: EntityPrefix;
  id: number;
  fullId: string; // e.g., "t-1"
  title: string; // kebab-case from filename
  displayTitle: string; // Title Case for display
}

/**
 * Parsed reference information
 */
export interface ParsedReference {
  raw: string; // Original string, e.g., "blocked-by:i-1/t-3"
  relationship?: "blocked-by"; // Only blocking supported for now
  initiative?: string; // e.g., "i-1" if scoped to initiative
  targetId: string; // e.g., "t-3", "d-1", "i-1"
  targetType: EntityPrefix;
}

/**
 * Counter file structure
 */
export interface Counters {
  t: number;
  d: number;
  i: number;
}

/**
 * Represents a single task parsed from a markdown file
 */
export interface Task {
  id: string; // e.g., "t-1"
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  tags?: string[];
  references?: ParsedReference[];
  filePath: string;
  content: string;
  initiative?: string; // Extracted from path, e.g., "i-1"
}

/**
 * Represents a document parsed from a markdown file
 */
export interface Document {
  id: string; // e.g., "d-1"
  title: string;
  description?: string;
  tags?: string[];
  references?: ParsedReference[];
  filePath: string;
  content: string;
}

/**
 * Represents an initiative (collection of related tasks)
 */
export interface Initiative {
  id: string; // e.g., "i-1"
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  references?: ParsedReference[];
  tasks: Task[];
  filePath: string;
}

/**
 * Parsed frontmatter from a task markdown file
 */
export interface TaskFrontmatter {
  status: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  tags?: string[];
  references?: string | string[];
}

/**
 * Parsed frontmatter from a document markdown file
 */
export interface DocumentFrontmatter {
  description?: string;
  tags?: string[];
  references?: string | string[];
}

/**
 * Parsed frontmatter from an initiative markdown file
 */
export interface InitiativeFrontmatter {
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  tags?: string[];
  references?: string | string[];
}

/**
 * Represents a validation error with detailed information
 */
export interface ValidationError {
  filePath: string;
  field: string;
  message: string;
  receivedValue?: unknown;
  expectedValues?: string[];
  errorType?:
    | "invalid-filename"
    | "duplicate-id"
    | "invalid-reference"
    | "invalid-enum"
    | "counter-mismatch"
    | "missing-required";
}

/**
 * Result of validating frontmatter
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

/**
 * Context for reference validation
 */
export interface ValidationContext {
  taskMap: Map<string, Task>;
  documentMap: Map<string, Document>;
  initiativeMap: Map<string, Initiative>;
  counters: Counters;
}

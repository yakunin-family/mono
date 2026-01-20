/**
 * Task status representing the current state of a task
 */
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

/**
 * Task priority level
 */
export type TaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Represents a single task parsed from a markdown file
 */
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  blockedBy?: string[];
  blocks?: string[];
  relatedTo?: string[];
  filePath: string;
  content: string;
  initiative?: string;
}

/**
 * Represents an initiative (collection of related tasks)
 */
export interface Initiative {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  owner?: string;
  startDate?: string;
  targetDate?: string;
  tags?: string[];
  tasks: Task[];
  filePath: string;
}

/**
 * Parsed frontmatter from a task markdown file
 */
export interface TaskFrontmatter {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  blockedBy?: string[];
  blocks?: string[];
  relatedTo?: string[];
  initiative?: string;
}

/**
 * Parsed frontmatter from an initiative markdown file
 */
export interface InitiativeFrontmatter {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  owner?: string;
  startDate?: string;
  targetDate?: string;
  tags?: string[];
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
}

/**
 * Result of validating frontmatter
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

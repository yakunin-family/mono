import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type {
  Task,
  TaskStatus,
  TaskFrontmatter,
  DocumentFrontmatter,
  InitiativeFrontmatter,
  ValidationError,
  ValidationResult,
  ParsedFilename,
  ParsedReference,
  EntityPrefix,
  Counters,
  ValidationContext,
} from "./types.js";

/**
 * Allowed values for task/initiative status
 */
export const TASK_STATUSES = [
  "todo",
  "in-progress",
  "done",
  "blocked",
] as const;

/**
 * Allowed values for task/initiative priority
 */
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;

/**
 * Entity prefix validation
 */
export const ENTITY_PREFIXES = ["t", "d", "i"] as const;

// =============================================================================
// FILENAME PARSING
// =============================================================================

/**
 * Regex pattern for parsing filenames like "[t-1]-implement-auth.md"
 */
const FILENAME_PATTERN = /^\[([tdi])-(\d+)\]-(.+)\.md$/;

/**
 * Regex pattern for parsing initiative folder names like "[i-1]-user-management"
 */
const INITIATIVE_FOLDER_PATTERN = /^\[i-(\d+)\]-(.+)$/;

/**
 * Parse a filename like "[t-1]-implement-auth.md"
 */
export function parseFilename(filename: string): ParsedFilename | null {
  const match = filename.match(FILENAME_PATTERN);
  if (!match) return null;

  const [, prefix, idStr, title] = match;
  if (!prefix || !idStr || !title) return null;

  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;

  return {
    prefix: prefix as EntityPrefix,
    id,
    fullId: `${prefix}-${id}`,
    title,
    displayTitle: toDisplayTitle(title),
  };
}

/**
 * Parse an initiative folder name like "[i-1]-user-management"
 */
export function parseInitiativeFolderName(
  folderName: string,
): { id: number; fullId: string; title: string; displayTitle: string } | null {
  const match = folderName.match(INITIATIVE_FOLDER_PATTERN);
  if (!match) return null;

  const [, idStr, title] = match;
  if (!idStr || !title) return null;

  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;

  return {
    id,
    fullId: `i-${id}`,
    title,
    displayTitle: toDisplayTitle(title),
  };
}

/**
 * Convert kebab-case to Title Case
 */
export function toDisplayTitle(kebabCase: string): string {
  return kebabCase
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Validate filename matches expected format for given prefix
 */
export function isValidFilename(
  filename: string,
  expectedPrefix?: EntityPrefix,
): boolean {
  const parsed = parseFilename(filename);
  if (!parsed) return false;
  if (expectedPrefix && parsed.prefix !== expectedPrefix) return false;
  return true;
}

// =============================================================================
// REFERENCE PARSING
// =============================================================================

/**
 * Regex pattern for parsing references like "blocked-by:t-3" or "t-1" or "d-2" or "i-1"
 * Uses flat IDs only - no initiative scoping (i-x/t-y syntax removed)
 */
const REFERENCE_PATTERN = /^(?:(blocked-by):)?([tdi]-\d+)$/;

/**
 * Parse a single reference string like "blocked-by:t-3" or "t-1"
 */
export function parseReference(ref: string): ParsedReference | null {
  const trimmed = ref.trim();
  const match = trimmed.match(REFERENCE_PATTERN);
  if (!match) return null;

  const [, relationship, targetId] = match;
  if (!targetId) return null;

  const targetType = targetId.charAt(0) as EntityPrefix;
  if (!ENTITY_PREFIXES.includes(targetType)) return null;

  return {
    raw: trimmed,
    relationship: relationship as "blocked-by" | undefined,
    targetId,
    targetType,
  };
}

/**
 * Parse references array from frontmatter (can be string or array)
 */
export function parseReferences(
  refs: string[] | string | undefined,
): ParsedReference[] {
  if (!refs) return [];

  // Handle comma-separated string or array
  const refList =
    typeof refs === "string"
      ? refs.split(",").map((r) => r.trim())
      : refs.flatMap((r) => r.split(",").map((s) => s.trim()));

  const parsed: ParsedReference[] = [];
  for (const ref of refList) {
    if (!ref) continue;
    const result = parseReference(ref);
    if (result) {
      parsed.push(result);
    }
  }

  return parsed;
}

/**
 * Validate a reference exists in the validation context
 */
export function validateReference(
  ref: ParsedReference,
  context: ValidationContext,
  filePath: string,
): ValidationError | null {
  const { taskMap, documentMap, initiativeMap } = context;

  // Check if the referenced entity exists using flat ID lookup
  switch (ref.targetType) {
    case "t": {
      if (!taskMap.has(ref.targetId)) {
        return {
          filePath,
          field: "references",
          message: `Reference not found: Task "${ref.targetId}" does not exist`,
          receivedValue: ref.raw,
          errorType: "invalid-reference",
        };
      }
      break;
    }
    case "d": {
      if (!documentMap.has(ref.targetId)) {
        return {
          filePath,
          field: "references",
          message: `Reference not found: Document "${ref.targetId}" does not exist`,
          receivedValue: ref.raw,
          errorType: "invalid-reference",
        };
      }
      break;
    }
    case "i": {
      if (!initiativeMap.has(ref.targetId)) {
        return {
          filePath,
          field: "references",
          message: `Reference not found: Initiative "${ref.targetId}" does not exist`,
          receivedValue: ref.raw,
          errorType: "invalid-reference",
        };
      }
      break;
    }
  }

  return null;
}

// =============================================================================
// COUNTER UTILITIES
// =============================================================================

/**
 * Read counters file
 */
export async function readCounters(metaPath: string): Promise<Counters> {
  try {
    const countersPath = join(metaPath, "counters.json");
    const content = await readFile(countersPath, "utf-8");
    return JSON.parse(content) as Counters;
  } catch {
    // Return default counters if file doesn't exist
    return { t: 0, d: 0, i: 0 };
  }
}

/**
 * Write counters file
 */
export async function writeCounters(
  metaPath: string,
  counters: Counters,
): Promise<void> {
  const countersPath = join(metaPath, "counters.json");
  await writeFile(
    countersPath,
    JSON.stringify(counters, null, 2) + "\n",
    "utf-8",
  );
}

/**
 * Validate ID against counter value
 */
export function validateIdAgainstCounter(
  fullId: string,
  counters: Counters,
  filePath: string,
): ValidationError | null {
  const prefix = fullId.charAt(0) as EntityPrefix;
  const idNum = parseInt(fullId.slice(2), 10);

  if (isNaN(idNum)) {
    return {
      filePath,
      field: "filename",
      message: `Invalid ID format: "${fullId}"`,
      receivedValue: fullId,
      errorType: "invalid-filename",
    };
  }

  const counterValue = counters[prefix];
  if (idNum > counterValue) {
    return {
      filePath,
      field: "filename",
      message: `ID exceeds counter: "${fullId}" > ${prefix}=${counterValue}. Update counters.json or rename file.`,
      receivedValue: idNum,
      expectedValues: [`<= ${counterValue}`],
      errorType: "counter-mismatch",
    };
  }

  return null;
}

// =============================================================================
// FRONTMATTER VALIDATION
// =============================================================================

/**
 * Zod schema for task frontmatter (no id/title - derived from filename)
 */
export const taskFrontmatterSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    required_error: "status is required",
    invalid_type_error: `status must be one of: ${TASK_STATUSES.join(", ")}`,
  }),
  priority: z
    .enum(TASK_PRIORITIES, {
      invalid_type_error: `priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
    })
    .optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  references: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Zod schema for document frontmatter (all optional)
 */
export const documentFrontmatterSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  references: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Zod schema for initiative frontmatter (all optional)
 */
export const initiativeFrontmatterSchema = z.object({
  status: z
    .enum(TASK_STATUSES, {
      invalid_type_error: `status must be one of: ${TASK_STATUSES.join(", ")}`,
    })
    .optional(),
  priority: z
    .enum(TASK_PRIORITIES, {
      invalid_type_error: `priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
    })
    .optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  references: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Convert Zod errors to ValidationError format
 */
function zodErrorsToValidationErrors(
  zodError: z.ZodError,
  filePath: string,
): ValidationError[] {
  return zodError.errors.map((error) => {
    const field = error.path.join(".");
    let message = error.message;
    let expectedValues: string[] | undefined;
    let receivedValue: unknown;

    if (error.code === "invalid_enum_value") {
      expectedValues = error.options as string[];
      receivedValue = error.received;
      message = `Invalid value "${error.received}". Expected one of: ${expectedValues.join(", ")}`;
    } else if (error.code === "invalid_type") {
      receivedValue = error.received;
      message = `Expected ${error.expected}, received ${error.received}`;
    }

    return {
      filePath,
      field: field || "root",
      message,
      receivedValue,
      expectedValues,
      errorType: "invalid-enum" as const,
    };
  });
}

/**
 * Validate task frontmatter with detailed error messages
 */
export function validateTaskFrontmatterWithErrors(
  data: unknown,
  filePath: string,
): ValidationResult<TaskFrontmatter> {
  const result = taskFrontmatterSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as TaskFrontmatter,
      errors: [],
    };
  }

  return {
    success: false,
    errors: zodErrorsToValidationErrors(result.error, filePath),
  };
}

/**
 * Validate document frontmatter with detailed error messages
 */
export function validateDocumentFrontmatterWithErrors(
  data: unknown,
  filePath: string,
): ValidationResult<DocumentFrontmatter> {
  const result = documentFrontmatterSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as DocumentFrontmatter,
      errors: [],
    };
  }

  return {
    success: false,
    errors: zodErrorsToValidationErrors(result.error, filePath),
  };
}

/**
 * Validate initiative frontmatter with detailed error messages
 */
export function validateInitiativeFrontmatterWithErrors(
  data: unknown,
  filePath: string,
): ValidationResult<InitiativeFrontmatter> {
  const result = initiativeFrontmatterSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as InitiativeFrontmatter,
      errors: [],
    };
  }

  return {
    success: false,
    errors: zodErrorsToValidationErrors(result.error, filePath),
  };
}

/**
 * Validate task frontmatter structure (legacy boolean version)
 */
export function validateTaskFrontmatter(data: unknown): boolean {
  return taskFrontmatterSchema.safeParse(data).success;
}

/**
 * Validate initiative frontmatter structure (legacy boolean version)
 */
export function validateInitiativeFrontmatter(data: unknown): boolean {
  return initiativeFrontmatterSchema.safeParse(data).success;
}

/**
 * Validate document frontmatter structure (legacy boolean version)
 */
export function validateDocumentFrontmatter(data: unknown): boolean {
  return documentFrontmatterSchema.safeParse(data).success;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith("--")) {
        result[key] = nextArg;
        i++;
      } else {
        result[key] = "true";
      }
    } else if (!arg.startsWith("-")) {
      if (!result.command) {
        result.command = arg;
      }
    }
  }

  return result;
}

/**
 * Calculate task completion percentage for an initiative
 */
export function calculateProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "done").length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Check if a task is blocked based on references
 */
export function isBlocked(task: Task, taskMap: Map<string, Task>): boolean {
  if (!task.references || task.references.length === 0) return false;

  const blockers = task.references.filter(
    (r) => r.relationship === "blocked-by",
  );
  if (blockers.length === 0) return false;

  for (const blocker of blockers) {
    const blockingTask = taskMap.get(blocker.targetId);
    if (blockingTask && blockingTask.status !== "done") {
      return true;
    }
  }

  return false;
}

/**
 * Sort tasks by priority and status
 */
export function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder: Record<TaskStatus, number> = {
    "in-progress": 0,
    blocked: 1,
    todo: 2,
    done: 3,
  };

  return [...tasks].sort((a, b) => {
    const statusCompare = statusOrder[a.status] - statusOrder[b.status];
    if (statusCompare !== 0) return statusCompare;

    const priorityA = a.priority ? priorityOrder[a.priority] : 4;
    const priorityB = b.priority ? priorityOrder[b.priority] : 4;
    return priorityA - priorityB;
  });
}

/**
 * Get blockers for a task from its references
 */
export function getBlockers(task: Task): ParsedReference[] {
  if (!task.references) return [];
  return task.references.filter((r) => r.relationship === "blocked-by");
}

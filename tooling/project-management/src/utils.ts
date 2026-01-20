import { z } from "zod";
import type {
  Task,
  TaskStatus,
  TaskFrontmatter,
  InitiativeFrontmatter,
  ValidationError,
  ValidationResult,
} from "./types.js";

/**
 * Allowed values for task/initiative status
 */
export const TASK_STATUSES = ["todo", "in-progress", "done", "blocked"] as const;

/**
 * Allowed values for task/initiative priority
 */
export const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;

/**
 * Zod schema for task frontmatter
 */
export const taskFrontmatterSchema = z.object({
  id: z
    .string({ required_error: "id is required" })
    .min(1, "id cannot be empty"),
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title cannot be empty"),
  status: z.enum(TASK_STATUSES, {
    required_error: "status is required",
    invalid_type_error: `status must be one of: ${TASK_STATUSES.join(", ")}`,
  }),
  priority: z
    .enum(TASK_PRIORITIES, {
      invalid_type_error: `priority must be one of: ${TASK_PRIORITIES.join(", ")}`,
    })
    .optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  blockedBy: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  relatedTo: z.array(z.string()).optional(),
  initiative: z.string().optional(),
});

/**
 * Zod schema for initiative frontmatter
 */
export const initiativeFrontmatterSchema = z.object({
  id: z
    .string({ required_error: "id is required" })
    .min(1, "id cannot be empty"),
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title cannot be empty"),
  description: z.string().optional(),
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
  owner: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Convert Zod errors to ValidationError format
 */
function zodErrorsToValidationErrors(
  zodError: z.ZodError,
  filePath: string
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
    };
  });
}

/**
 * Validate task frontmatter with detailed error messages
 */
export function validateTaskFrontmatterWithErrors(
  data: unknown,
  filePath: string
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
 * Validate initiative frontmatter with detailed error messages
 */
export function validateInitiativeFrontmatterWithErrors(
  data: unknown,
  filePath: string
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
 * Utility functions for task and initiative management
 */

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
 * Check if a task is blocked
 */
export function isBlocked(task: Task, allTasks: Task[]): boolean {
  if (!task.blockedBy || task.blockedBy.length === 0) return false;

  const blockingTasks = allTasks.filter((t) => task.blockedBy?.includes(t.id));
  return blockingTasks.some((t) => t.status !== "done");
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

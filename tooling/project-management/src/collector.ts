import chokidar from "chokidar";
import { glob } from "glob";
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import type {
  Task,
  Initiative,
  TaskFrontmatter,
  InitiativeFrontmatter,
  ValidationError,
} from "./types.js";
import {
  validateTaskFrontmatterWithErrors,
  validateInitiativeFrontmatterWithErrors,
} from "./utils.js";

export interface CollectionResult {
  tasks: Task[];
  initiatives: Initiative[];
  taskMap: Map<string, Task>;
  warnings: string[];
  validationErrors: ValidationError[];
}

/**
 * Collects and parses all task and initiative markdown files from the source directory
 */
export class Collector {
  constructor(private sourcePath: string) {}

  /**
   * Collect all tasks and initiatives from markdown files
   */
  async collect(): Promise<CollectionResult> {
    const warnings: string[] = [];
    const validationErrors: ValidationError[] = [];
    const tasks: Task[] = [];
    const initiatives: Initiative[] = [];

    const taskFiles = await this.findTaskFiles();
    const initiativeFiles = await this.findInitiativeFiles();

    for (const filePath of taskFiles) {
      try {
        const result = await this.parseTaskFile(filePath);
        if (result.task) {
          tasks.push(result.task);
        }
        if (result.errors.length > 0) {
          validationErrors.push(...result.errors);
          warnings.push(`Failed to parse task file: ${filePath}`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Error parsing task file ${filePath}: ${message}`);
      }
    }

    for (const filePath of initiativeFiles) {
      try {
        const result = await this.parseInitiativeFile(filePath);
        if (result.initiative) {
          initiatives.push(result.initiative);
        }
        if (result.errors.length > 0) {
          validationErrors.push(...result.errors);
          warnings.push(`Failed to parse initiative file: ${filePath}`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Error parsing initiative file ${filePath}: ${message}`);
      }
    }

    const taskMap = this.buildTaskMap(tasks);

    this.validateDependencies(tasks, taskMap, warnings);

    this.linkInitiativeTasks(tasks, initiatives);

    return {
      tasks,
      initiatives,
      taskMap,
      warnings,
      validationErrors,
    };
  }

  /**
   * Collect all tasks from markdown files
   */
  async collectTasks(): Promise<Task[]> {
    const result = await this.collect();
    return result.tasks;
  }

  /**
   * Collect all initiatives from markdown files
   */
  async collectInitiatives(): Promise<Initiative[]> {
    const result = await this.collect();
    return result.initiatives;
  }

  /**
   * Find all task markdown files
   */
  private async findTaskFiles(): Promise<string[]> {
    const patterns = [
      join(this.sourcePath, "tasks", "*.md"),
      join(this.sourcePath, "initiatives", "**", "task-*.md"),
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { absolute: true });
      files.push(...matches);
    }

    return files;
  }

  /**
   * Find all initiative README files
   */
  private async findInitiativeFiles(): Promise<string[]> {
    const pattern = join(this.sourcePath, "initiatives", "**", "README.md");
    return glob(pattern, { absolute: true });
  }

  /**
   * Parse a task markdown file
   */
  private async parseTaskFile(
    filePath: string
  ): Promise<{ task: Task | null; errors: ValidationError[] }> {
    const content = await readFile(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const validationResult = validateTaskFrontmatterWithErrors(data, filePath);

    if (!validationResult.success) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      console.warn(`Warning: Invalid task frontmatter in ${filePath}:\n${errorMessages}`);
      return { task: null, errors: validationResult.errors };
    }

    const frontmatter = validationResult.data as TaskFrontmatter;
    const initiativePath = this.extractInitiativeFromPath(filePath);

    return {
      task: {
        id: frontmatter.id,
        title: frontmatter.title,
        status: frontmatter.status,
        priority: frontmatter.priority,
        assignee: frontmatter.assignee,
        dueDate: frontmatter.dueDate,
        tags: frontmatter.tags,
        blockedBy: frontmatter.blockedBy,
        blocks: frontmatter.blocks,
        relatedTo: frontmatter.relatedTo,
        filePath,
        content: markdownContent.trim(),
        initiative: frontmatter.initiative || initiativePath,
      },
      errors: [],
    };
  }

  /**
   * Parse an initiative README file
   */
  private async parseInitiativeFile(
    filePath: string
  ): Promise<{ initiative: Initiative | null; errors: ValidationError[] }> {
    const content = await readFile(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const validationResult = validateInitiativeFrontmatterWithErrors(
      data,
      filePath
    );

    if (!validationResult.success) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      console.warn(
        `Warning: Invalid initiative frontmatter in ${filePath}:\n${errorMessages}`
      );
      return { initiative: null, errors: validationResult.errors };
    }

    const frontmatter = validationResult.data as InitiativeFrontmatter;

    return {
      initiative: {
        id: frontmatter.id,
        title: frontmatter.title,
        description: frontmatter.description || markdownContent.trim(),
        status: frontmatter.status,
        priority: frontmatter.priority,
        owner: frontmatter.owner,
        startDate: frontmatter.startDate,
        targetDate: frontmatter.targetDate,
        tags: frontmatter.tags,
        tasks: [],
        filePath,
      },
      errors: [],
    };
  }

  /**
   * Extract initiative name from file path
   */
  private extractInitiativeFromPath(filePath: string): string | undefined {
    const relativePath = relative(this.sourcePath, filePath);
    const parts = relativePath.split("/");

    if (parts[0] === "initiatives" && parts.length >= 3) {
      return parts[1];
    }

    return undefined;
  }

  /**
   * Build a map of tasks by ID for quick lookups
   */
  private buildTaskMap(tasks: Task[]): Map<string, Task> {
    const taskMap = new Map<string, Task>();

    for (const task of tasks) {
      if (taskMap.has(task.id)) {
        console.warn(
          `Warning: Duplicate task ID "${task.id}" found. Using last occurrence at ${task.filePath}`
        );
      }
      taskMap.set(task.id, task);
    }

    return taskMap;
  }

  /**
   * Validate dependencies and warn about orphaned references
   */
  private validateDependencies(
    tasks: Task[],
    taskMap: Map<string, Task>,
    warnings: string[]
  ): void {
    for (const task of tasks) {
      if (task.blockedBy) {
        for (const blockerId of task.blockedBy) {
          if (!taskMap.has(blockerId)) {
            warnings.push(
              `Warning: Task "${task.id}" references non-existent blocker "${blockerId}"`
            );
          }
        }
      }

      if (task.blocks) {
        for (const blockedId of task.blocks) {
          if (!taskMap.has(blockedId)) {
            warnings.push(
              `Warning: Task "${task.id}" references non-existent blocked task "${blockedId}"`
            );
          }
        }
      }

      if (task.relatedTo) {
        for (const relatedId of task.relatedTo) {
          if (!taskMap.has(relatedId)) {
            warnings.push(
              `Warning: Task "${task.id}" references non-existent related task "${relatedId}"`
            );
          }
        }
      }
    }
  }

  /**
   * Link tasks to their initiatives
   */
  private linkInitiativeTasks(tasks: Task[], initiatives: Initiative[]): void {
    const initiativeMap = new Map<string, Initiative>();

    for (const initiative of initiatives) {
      initiativeMap.set(initiative.id, initiative);
    }

    for (const task of tasks) {
      if (task.initiative) {
        const initiative = initiativeMap.get(task.initiative);
        if (initiative) {
          initiative.tasks.push(task);
        } else {
          console.warn(
            `Warning: Task "${task.id}" references non-existent initiative "${task.initiative}"`
          );
        }
      }
    }
  }

  /**
   * Watch for changes in markdown files and trigger re-collection
   */
  watch(callback: () => void): void {
    const watchDirs = [
      join(this.sourcePath, "tasks"),
      join(this.sourcePath, "initiatives"),
    ];

    console.log("🔍 Setting up file watcher...");
    console.log(`   Source path: ${this.sourcePath}`);
    console.log(`   Watching directories:`);
    for (const dir of watchDirs) {
      console.log(`     - ${dir}`);
    }

    const watcher = chokidar.watch(watchDirs, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      depth: 99,
    });

    watcher.on("ready", () => {
      const watched = watcher.getWatched();
      const dirCount = Object.keys(watched).length;
      let fileCount = 0;
      for (const files of Object.values(watched)) {
        fileCount += files.filter((f) => f.endsWith(".md")).length;
      }
      console.log(
        `✓ Watcher ready - monitoring ${dirCount} directories with ${fileCount} markdown files`
      );
      console.log();
    });

    watcher.on("change", (path) => {
      if (!path.endsWith(".md")) return;
      console.log(`📝 File changed: ${relative(this.sourcePath, path)}`);
      callback();
    });

    watcher.on("add", (path) => {
      if (!path.endsWith(".md")) return;
      console.log(`➕ File added: ${relative(this.sourcePath, path)}`);
      callback();
    });

    watcher.on("unlink", (path) => {
      if (!path.endsWith(".md")) return;
      console.log(`🗑️  File removed: ${relative(this.sourcePath, path)}`);
      callback();
    });

    watcher.on("error", (error) => {
      console.error("❌ Watcher error:", error);
    });

    process.on("SIGINT", () => {
      console.log("\n👋 Stopping watcher...");
      watcher.close().then(() => {
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      watcher.close().then(() => {
        process.exit(0);
      });
    });
  }
}

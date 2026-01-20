import { glob } from "glob";
import matter from "gray-matter";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import type {
  Task,
  Document,
  Initiative,
  TaskFrontmatter,
  DocumentFrontmatter,
  InitiativeFrontmatter,
  ValidationError,
  Counters,
  ParsedReference,
} from "./types.js";
import {
  parseFilename,
  parseInitiativeFolderName,
  parseReferences,
  readCounters,
  validateIdAgainstCounter,
  validateTaskFrontmatterWithErrors,
  validateDocumentFrontmatterWithErrors,
  validateInitiativeFrontmatterWithErrors,
} from "./utils.js";

export interface CollectionResult {
  tasks: Task[];
  documents: Document[];
  initiatives: Initiative[];
  taskMap: Map<string, Task>;
  documentMap: Map<string, Document>;
  initiativeMap: Map<string, Initiative>;
  counters: Counters;
  warnings: string[];
  validationErrors: ValidationError[];
}

/**
 * Collects and parses all task, document, and initiative markdown files from the source directory
 */
export class Collector {
  constructor(private sourcePath: string) {}

  /**
   * Collect all tasks, documents, and initiatives from markdown files
   */
  async collect(): Promise<CollectionResult> {
    const warnings: string[] = [];
    const validationErrors: ValidationError[] = [];
    const tasks: Task[] = [];
    const documents: Document[] = [];
    const initiatives: Initiative[] = [];

    const counters = await readCounters(join(this.sourcePath, "_meta"));

    const taskFiles = await this.findTaskFiles();
    const documentFiles = await this.findDocumentFiles();
    const initiativeFiles = await this.findInitiativeFiles();

    for (const filePath of taskFiles) {
      try {
        const result = await this.parseTaskFile(filePath, counters);
        if (result.task) {
          tasks.push(result.task);
        }
        if (result.errors.length > 0) {
          validationErrors.push(...result.errors);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Error parsing task file ${filePath}: ${message}`);
      }
    }

    for (const filePath of documentFiles) {
      try {
        const result = await this.parseDocumentFile(filePath, counters);
        if (result.document) {
          documents.push(result.document);
        }
        if (result.errors.length > 0) {
          validationErrors.push(...result.errors);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Error parsing document file ${filePath}: ${message}`);
      }
    }

    for (const filePath of initiativeFiles) {
      try {
        const result = await this.parseInitiativeFile(filePath, counters);
        if (result.initiative) {
          initiatives.push(result.initiative);
        }
        if (result.errors.length > 0) {
          validationErrors.push(...result.errors);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        warnings.push(`Error parsing initiative file ${filePath}: ${message}`);
      }
    }

    const taskMap = this.buildTaskMap(tasks, validationErrors);
    const documentMap = this.buildDocumentMap(documents, validationErrors);
    const initiativeMap = this.buildInitiativeMap(initiatives, validationErrors);

    this.linkInitiativeTasks(tasks, initiativeMap);

    this.validateReferences(tasks, documents, initiatives, taskMap, documentMap, initiativeMap, validationErrors);

    return {
      tasks,
      documents,
      initiatives,
      taskMap,
      documentMap,
      initiativeMap,
      counters,
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
   * Collect all documents from markdown files
   */
  async collectDocuments(): Promise<Document[]> {
    const result = await this.collect();
    return result.documents;
  }

  /**
   * Collect all initiatives from markdown files
   */
  async collectInitiatives(): Promise<Initiative[]> {
    const result = await this.collect();
    return result.initiatives;
  }

  /**
   * Find all task markdown files matching [t-x]-*.md pattern
   */
  private async findTaskFiles(): Promise<string[]> {
    const patterns = [
      join(this.sourcePath, "tasks", "\\[t-*\\]-*.md"),
      join(this.sourcePath, "initiatives", "\\[i-*\\]-*", "\\[t-*\\]-*.md"),
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { absolute: true });
      files.push(...matches);
    }

    return files;
  }

  /**
   * Find all document markdown files matching [d-x]-*.md pattern
   */
  private async findDocumentFiles(): Promise<string[]> {
    const pattern = join(this.sourcePath, "docs", "\\[d-*\\]-*.md");
    return glob(pattern, { absolute: true });
  }

  /**
   * Find all initiative README files in [i-x]-* folders
   */
  private async findInitiativeFiles(): Promise<string[]> {
    const pattern = join(this.sourcePath, "initiatives", "\\[i-*\\]-*", "README.md");
    return glob(pattern, { absolute: true });
  }

  /**
   * Parse a task markdown file
   */
  private async parseTaskFile(
    filePath: string,
    counters: Counters
  ): Promise<{ task: Task | null; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    const filename = basename(filePath);

    const parsed = parseFilename(filename);
    if (!parsed || parsed.prefix !== "t") {
      errors.push({
        filePath,
        field: "filename",
        message: `Invalid task filename format. Expected "[t-x]-title.md", got "${filename}"`,
        receivedValue: filename,
        errorType: "invalid-filename",
      });
      return { task: null, errors };
    }

    const counterError = validateIdAgainstCounter(parsed.fullId, counters, filePath);
    if (counterError) {
      errors.push(counterError);
    }

    const content = await readFile(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const validationResult = validateTaskFrontmatterWithErrors(data, filePath);

    if (!validationResult.success) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      console.warn(`Warning: Invalid task frontmatter in ${filePath}:\n${errorMessages}`);
      return { task: null, errors: [...errors, ...validationResult.errors] };
    }

    const frontmatter = validationResult.data as TaskFrontmatter;
    const initiativeId = this.extractInitiativeFromPath(filePath);

    const references = parseReferences(frontmatter.references);

    return {
      task: {
        id: parsed.fullId,
        title: parsed.displayTitle,
        status: frontmatter.status,
        priority: frontmatter.priority,
        description: frontmatter.description,
        tags: frontmatter.tags,
        references,
        filePath,
        content: markdownContent.trim(),
        initiative: initiativeId,
      },
      errors,
    };
  }

  /**
   * Parse a document markdown file
   */
  private async parseDocumentFile(
    filePath: string,
    counters: Counters
  ): Promise<{ document: Document | null; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    const filename = basename(filePath);

    const parsed = parseFilename(filename);
    if (!parsed || parsed.prefix !== "d") {
      errors.push({
        filePath,
        field: "filename",
        message: `Invalid document filename format. Expected "[d-x]-title.md", got "${filename}"`,
        receivedValue: filename,
        errorType: "invalid-filename",
      });
      return { document: null, errors };
    }

    const counterError = validateIdAgainstCounter(parsed.fullId, counters, filePath);
    if (counterError) {
      errors.push(counterError);
    }

    const content = await readFile(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const validationResult = validateDocumentFrontmatterWithErrors(data, filePath);

    if (!validationResult.success) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      console.warn(`Warning: Invalid document frontmatter in ${filePath}:\n${errorMessages}`);
      return { document: null, errors: [...errors, ...validationResult.errors] };
    }

    const frontmatter = validationResult.data as DocumentFrontmatter;
    const references = parseReferences(frontmatter.references);

    return {
      document: {
        id: parsed.fullId,
        title: parsed.displayTitle,
        description: frontmatter.description,
        tags: frontmatter.tags,
        references,
        filePath,
        content: markdownContent.trim(),
      },
      errors,
    };
  }

  /**
   * Parse an initiative README file
   */
  private async parseInitiativeFile(
    filePath: string,
    counters: Counters
  ): Promise<{ initiative: Initiative | null; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    const folderName = basename(dirname(filePath));

    const parsed = parseInitiativeFolderName(folderName);
    if (!parsed) {
      errors.push({
        filePath,
        field: "folder",
        message: `Invalid initiative folder format. Expected "[i-x]-title", got "${folderName}"`,
        receivedValue: folderName,
        errorType: "invalid-filename",
      });
      return { initiative: null, errors };
    }

    const counterError = validateIdAgainstCounter(parsed.fullId, counters, filePath);
    if (counterError) {
      errors.push(counterError);
    }

    const content = await readFile(filePath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const validationResult = validateInitiativeFrontmatterWithErrors(data, filePath);

    if (!validationResult.success) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join("\n");
      console.warn(
        `Warning: Invalid initiative frontmatter in ${filePath}:\n${errorMessages}`
      );
      return { initiative: null, errors: [...errors, ...validationResult.errors] };
    }

    const frontmatter = validationResult.data as InitiativeFrontmatter;
    const references = parseReferences(frontmatter.references);

    return {
      initiative: {
        id: parsed.fullId,
        title: parsed.displayTitle,
        description: frontmatter.description || markdownContent.trim(),
        status: frontmatter.status,
        priority: frontmatter.priority,
        tags: frontmatter.tags,
        references,
        tasks: [],
        filePath,
      },
      errors,
    };
  }

  /**
   * Extract initiative ID from file path
   */
  private extractInitiativeFromPath(filePath: string): string | undefined {
    const relativePath = relative(this.sourcePath, filePath);
    const parts = relativePath.split("/");

    if (parts[0] === "initiatives" && parts.length >= 3) {
      const folderName = parts[1];
      if (folderName) {
        const parsed = parseInitiativeFolderName(folderName);
        if (parsed) {
          return parsed.fullId;
        }
      }
    }

    return undefined;
  }

  /**
   * Build a map of tasks by ID for quick lookups
   */
  private buildTaskMap(
    tasks: Task[],
    validationErrors: ValidationError[]
  ): Map<string, Task> {
    const taskMap = new Map<string, Task>();

    for (const task of tasks) {
      if (taskMap.has(task.id)) {
        validationErrors.push({
          filePath: task.filePath,
          field: "id",
          message: `Duplicate task ID "${task.id}"`,
          receivedValue: task.id,
          errorType: "duplicate-id",
        });
      }
      taskMap.set(task.id, task);
    }

    return taskMap;
  }

  /**
   * Build a map of documents by ID for quick lookups
   */
  private buildDocumentMap(
    documents: Document[],
    validationErrors: ValidationError[]
  ): Map<string, Document> {
    const documentMap = new Map<string, Document>();

    for (const document of documents) {
      if (documentMap.has(document.id)) {
        validationErrors.push({
          filePath: document.filePath,
          field: "id",
          message: `Duplicate document ID "${document.id}"`,
          receivedValue: document.id,
          errorType: "duplicate-id",
        });
      }
      documentMap.set(document.id, document);
    }

    return documentMap;
  }

  /**
   * Build a map of initiatives by ID for quick lookups
   */
  private buildInitiativeMap(
    initiatives: Initiative[],
    validationErrors: ValidationError[]
  ): Map<string, Initiative> {
    const initiativeMap = new Map<string, Initiative>();

    for (const initiative of initiatives) {
      if (initiativeMap.has(initiative.id)) {
        validationErrors.push({
          filePath: initiative.filePath,
          field: "id",
          message: `Duplicate initiative ID "${initiative.id}"`,
          receivedValue: initiative.id,
          errorType: "duplicate-id",
        });
      }
      initiativeMap.set(initiative.id, initiative);
    }

    return initiativeMap;
  }

  /**
   * Validate all references across entities
   */
  private validateReferences(
    tasks: Task[],
    documents: Document[],
    initiatives: Initiative[],
    taskMap: Map<string, Task>,
    documentMap: Map<string, Document>,
    initiativeMap: Map<string, Initiative>,
    validationErrors: ValidationError[]
  ): void {
    const validateRefs = (
      refs: ParsedReference[] | undefined,
      filePath: string
    ) => {
      if (!refs) return;

      for (const ref of refs) {
        switch (ref.targetType) {
          case "t": {
            if (ref.initiative) {
              const initiative = initiativeMap.get(ref.initiative);
              if (!initiative) {
                validationErrors.push({
                  filePath,
                  field: "references",
                  message: `Reference not found: Initiative "${ref.initiative}" does not exist`,
                  receivedValue: ref.raw,
                  errorType: "invalid-reference",
                });
              } else {
                const taskInInitiative = initiative.tasks.find(
                  (t) => t.id === ref.targetId
                );
                if (!taskInInitiative) {
                  validationErrors.push({
                    filePath,
                    field: "references",
                    message: `Reference not found: Task "${ref.targetId}" does not exist in initiative "${ref.initiative}"`,
                    receivedValue: ref.raw,
                    errorType: "invalid-reference",
                  });
                }
              }
            } else if (!taskMap.has(ref.targetId)) {
              validationErrors.push({
                filePath,
                field: "references",
                message: `Reference not found: Task "${ref.targetId}" does not exist`,
                receivedValue: ref.raw,
                errorType: "invalid-reference",
              });
            }
            break;
          }
          case "d": {
            if (!documentMap.has(ref.targetId)) {
              validationErrors.push({
                filePath,
                field: "references",
                message: `Reference not found: Document "${ref.targetId}" does not exist`,
                receivedValue: ref.raw,
                errorType: "invalid-reference",
              });
            }
            break;
          }
          case "i": {
            if (!initiativeMap.has(ref.targetId)) {
              validationErrors.push({
                filePath,
                field: "references",
                message: `Reference not found: Initiative "${ref.targetId}" does not exist`,
                receivedValue: ref.raw,
                errorType: "invalid-reference",
              });
            }
            break;
          }
        }
      }
    };

    for (const task of tasks) {
      validateRefs(task.references, task.filePath);
    }

    for (const document of documents) {
      validateRefs(document.references, document.filePath);
    }

    for (const initiative of initiatives) {
      validateRefs(initiative.references, initiative.filePath);
    }
  }

  /**
   * Link tasks to their initiatives
   */
  private linkInitiativeTasks(
    tasks: Task[],
    initiativeMap: Map<string, Initiative>
  ): void {
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

}

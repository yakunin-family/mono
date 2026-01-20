import { readFileSync } from "node:fs";
import { relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  Task,
  Initiative,
  TaskStatus,
  TaskPriority,
  ValidationError,
} from "./types.js";
import { TASK_STATUSES, TASK_PRIORITIES } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates dashboard views and reports from collected tasks and initiatives
 */
export class Generator {
  private sourcePath?: string;

  /**
   * Set the source path for generating relative links
   */
  setSourcePath(sourcePath: string): void {
    this.sourcePath = sourcePath;
  }
  /**
   * Generate a dashboard overview showing all tasks and initiatives
   */
  generateDashboard(tasks: Task[], initiatives: Initiative[]): string {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeTasks = this.filterNonArchived(tasks);
    const activeInitiatives = this.filterNonArchivedInitiatives(initiatives);

    const sections: string[] = [];

    sections.push(this.generateHeader());
    sections.push(this.generateSummary(activeTasks));
    sections.push(this.generateInProgress(activeTasks));
    sections.push(this.generateHighPriorityTodo(activeTasks));
    sections.push(this.generateBlockedTasks(activeTasks));
    sections.push(this.generateInitiativesTable(activeInitiatives));
    sections.push(this.generateRecentlyCompleted(activeTasks, activeInitiatives, sevenDaysAgo));
    sections.push(this.generateOtherTasks(activeTasks));

    return sections.filter(Boolean).join("\n\n");
  }

  /**
   * Generate an errors report showing all validation errors with detailed messages
   */
  generateErrors(validationErrors: ValidationError[]): string {
    const timestamp = new Date().toISOString();
    const sections: string[] = [];

    sections.push(`# Validation Errors\n\n**Last Updated:** ${timestamp}`);

    if (validationErrors.length === 0) {
      sections.push(`## Status: All Clear ✅\n\nNo validation errors found. All task and initiative files are valid.`);
      return sections.join("\n\n");
    }

    sections.push(`## Status: ${validationErrors.length} Error(s) Found ❌\n\nThe following files have validation errors that need to be fixed.`);

    const errorsByFile = new Map<string, ValidationError[]>();
    for (const error of validationErrors) {
      const existing = errorsByFile.get(error.filePath) || [];
      existing.push(error);
      errorsByFile.set(error.filePath, existing);
    }

    for (const [filePath, errors] of errorsByFile) {
      const relativePath = this.makeRelativeLink(filePath);
      sections.push(this.generateFileErrorSection(relativePath, filePath, errors));
    }

    sections.push(this.generateValidValuesReference());

    return sections.join("\n\n");
  }

  private generateFileErrorSection(
    relativePath: string,
    absolutePath: string,
    errors: ValidationError[]
  ): string {
    const lines: string[] = [];
    lines.push(`### [${relativePath}](${relativePath})`);
    lines.push("");

    for (const error of errors) {
      lines.push(`**Field:** \`${error.field}\``);
      lines.push(`**Error:** ${error.message}`);

      if (error.receivedValue !== undefined) {
        const displayValue =
          typeof error.receivedValue === "string"
            ? `"${error.receivedValue}"`
            : String(error.receivedValue);
        lines.push(`**Received:** \`${displayValue}\``);
      }

      if (error.expectedValues && error.expectedValues.length > 0) {
        lines.push(`**Expected:** One of: \`${error.expectedValues.join("`, `")}\``);
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  private generateValidValuesReference(): string {
    return `---

## Valid Values Reference

### status
\`${TASK_STATUSES.join("` | `")}\`

### priority
\`${TASK_PRIORITIES.join("` | `")}\`

### Required Fields

**Tasks:**
- \`id\` - Non-empty string
- \`title\` - Non-empty string
- \`status\` - One of the valid status values

**Initiatives:**
- \`id\` - Non-empty string
- \`title\` - Non-empty string`;
  }

  /**
   * Generate a kanban board view grouped by status
   */
  generateKanbanBoard(tasks: Task[]): string {
    return "";
  }

  /**
   * Generate a timeline view of tasks by due date
   */
  generateTimeline(tasks: Task[]): string {
    return "";
  }

  /**
   * Generate initiative-specific reports
   */
  generateInitiativeReport(initiative: Initiative): string {
    return "";
  }

  /**
   * Generate comprehensive AI agent documentation by reading from template
   */
  generateAgentsGuide(): string {
    const templatePath = join(__dirname, "..", "templates", "agents-guide.md");
    return readFileSync(templatePath, "utf-8");
  }
  private generateHeader(): string {
    const timestamp = new Date().toISOString();
    return `# Project Dashboard\n\n**Last Updated:** ${timestamp}`;
  }

  private generateSummary(tasks: Task[]): string {
    const statusCounts = this.countByStatus(tasks);
    const total = tasks.length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const highPriority = tasks.filter(
      (t) => t.priority === "high" || t.priority === "critical"
    ).length;

    return `## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | ${total} |
| ├─ Todo | ${statusCounts.todo} |
| ├─ In Progress | ${statusCounts["in-progress"]} |
| ├─ Blocked | ${statusCounts.blocked} |
| └─ Done | ${statusCounts.done} |
| **High Priority** | ${highPriority} |`;
  }

  private generateInProgress(tasks: Task[]): string {
    const inProgressTasks = tasks
      .filter((t) => t.status === "in-progress")
      .sort(this.sortByPriorityThenTitle);

    if (inProgressTasks.length === 0) {
      return `## In Progress

_No tasks in progress_`;
    }

    const rows = inProgressTasks.map((task) => {
      const priority = this.formatPriority(task.priority);
      const assignee = task.assignee || "—";
      const initiative = task.initiative || "—";
      const link = this.formatTaskLink(task);

      return `| ${link} | ${priority} | ${assignee} | ${initiative} |`;
    });

    return `## In Progress

| Task | Priority | Assignee | Initiative |
|------|----------|----------|------------|
${rows.join("\n")}`;
  }

  private generateHighPriorityTodo(tasks: Task[]): string {
    const highPriorityTodos = tasks
      .filter(
        (t) =>
          t.status === "todo" &&
          (t.priority === "high" || t.priority === "critical")
      )
      .sort(this.sortByPriorityThenTitle);

    if (highPriorityTodos.length === 0) {
      return `## High Priority Todo

_No high priority tasks waiting_`;
    }

    const rows = highPriorityTodos.map((task) => {
      const priority = this.formatPriority(task.priority);
      const assignee = task.assignee || "—";
      const dueDate = task.dueDate || "—";
      const link = this.formatTaskLink(task);

      return `| ${link} | ${priority} | ${assignee} | ${dueDate} |`;
    });

    return `## High Priority Todo

| Task | Priority | Assignee | Due Date |
|------|----------|----------|----------|
${rows.join("\n")}`;
  }

  private generateBlockedTasks(tasks: Task[]): string {
    const blockedTasks = tasks
      .filter((t) => t.status === "blocked")
      .sort(this.sortByPriorityThenTitle);

    if (blockedTasks.length === 0) {
      return `## Blocked Tasks

_No blocked tasks_`;
    }

    const tasksById = new Map(tasks.map((t) => [t.id, t]));

    const rows = blockedTasks.map((task) => {
      const priority = this.formatPriority(task.priority);
      const link = this.formatTaskLink(task);

      const blockers = (task.blockedBy || [])
        .map((blockerId) => {
          const blocker = tasksById.get(blockerId);
          if (!blocker) {
            return `⚠️ ${blockerId} (missing)`;
          }
          const status = this.formatBlockerStatus(blocker.status);
          return `${status} ${this.formatTaskLink(blocker)}`;
        })
        .join("<br>");

      const blockersCell = blockers || "—";

      return `| ${link} | ${priority} | ${blockersCell} |`;
    });

    return `## Blocked Tasks

| Task | Priority | Blocked By |
|------|----------|------------|
${rows.join("\n")}`;
  }

  private generateInitiativesTable(initiatives: Initiative[]): string {
    if (initiatives.length === 0) {
      return `## Initiatives

_No initiatives_`;
    }

    const sortedInitiatives = [...initiatives].sort(
      (a, b) =>
        this.priorityOrder(b.priority) - this.priorityOrder(a.priority)
    );

    const rows = sortedInitiatives.map((init) => {
      const progress = this.calculateInitiativeProgress(init);
      const priority = this.formatPriority(init.priority);
      const owner = init.owner || "—";
      const status = this.formatStatus(init.status);
      const link = this.formatInitiativeLink(init);

      return `| ${link} | ${status} | ${progress} | ${priority} | ${owner} |`;
    });

    return `## Initiatives

| Initiative | Status | Progress | Priority | Owner |
|------------|--------|----------|----------|-------|
${rows.join("\n")}`;
  }

  private generateRecentlyCompleted(
    tasks: Task[],
    initiatives: Initiative[],
    since: Date
  ): string {
    const recentTasks = tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => a.title.localeCompare(b.title));

    const recentInitiatives = initiatives
      .filter((init) => init.status === "done")
      .sort((a, b) => a.title.localeCompare(b.title));

    if (recentTasks.length === 0 && recentInitiatives.length === 0) {
      return `## Recently Completed (Last 7 Days)

_No recently completed items_`;
    }

    const sections: string[] = [];

    if (recentInitiatives.length > 0) {
      const initRows = recentInitiatives.map((init) => {
        const link = this.formatInitiativeLink(init);
        const taskCount = init.tasks.length;
        return `| ${link} | ${taskCount} tasks |`;
      });

      sections.push(`**Initiatives:**

| Initiative | Tasks |
|------------|-------|
${initRows.join("\n")}`);
    }

    if (recentTasks.length > 0) {
      const taskRows = recentTasks.map((task) => {
        const link = this.formatTaskLink(task);
        const initiative = task.initiative || "—";
        return `| ${link} | ${initiative} |`;
      });

      sections.push(`**Tasks:**

| Task | Initiative |
|------|------------|
${taskRows.join("\n")}`);
    }

    return `## Recently Completed (Last 7 Days)

${sections.join("\n\n")}`;
  }

  private generateOtherTasks(tasks: Task[]): string {
    const otherTasks = tasks.filter(
      (t) =>
        t.status === "todo" &&
        t.priority !== "high" &&
        t.priority !== "critical"
    );

    if (otherTasks.length === 0) {
      return `## Other Tasks

_No other tasks_`;
    }

    const byPriority = this.groupByPriority(otherTasks);
    const sections: string[] = [];

    const priorities: Array<TaskPriority | "unprioritized"> = [
      "medium",
      "low",
      "unprioritized",
    ];

    for (const priority of priorities) {
      const tasksInPriority = byPriority[priority];
      if (tasksInPriority && tasksInPriority.length > 0) {
        const label = priority === "unprioritized" ? "Unprioritized" : this.capitalizeFirst(priority);
        const rows = tasksInPriority.map((task) => {
          const link = this.formatTaskLink(task);
          const assignee = task.assignee || "—";
          const initiative = task.initiative || "—";
          return `| ${link} | ${assignee} | ${initiative} |`;
        });

        sections.push(`### ${label}

| Task | Assignee | Initiative |
|------|----------|------------|
${rows.join("\n")}`);
      }
    }

    return `## Other Tasks

${sections.join("\n\n")}`;
  }

  private filterNonArchived(tasks: Task[]): Task[] {
    return tasks.filter((t) => !t.filePath.includes("/archive/"));
  }

  private filterNonArchivedInitiatives(initiatives: Initiative[]): Initiative[] {
    return initiatives.filter((i) => !i.filePath.includes("/archive/"));
  }

  private countByStatus(tasks: Task[]): Record<TaskStatus, number> {
    return {
      todo: tasks.filter((t) => t.status === "todo").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      blocked: tasks.filter((t) => t.status === "blocked").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }

  private calculateInitiativeProgress(initiative: Initiative): string {
    if (initiative.tasks.length === 0) {
      return "0%";
    }

    const done = initiative.tasks.filter((t) => t.status === "done").length;
    const percentage = Math.round((done / initiative.tasks.length) * 100);

    return `${percentage}% (${done}/${initiative.tasks.length})`;
  }

  private groupByPriority(
    tasks: Task[]
  ): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {
      medium: [],
      low: [],
      unprioritized: [],
    };

    for (const task of tasks) {
      const key = task.priority || "unprioritized";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    }

    for (const key in groups) {
      const group = groups[key];
      if (group) {
        group.sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    return groups;
  }

  private sortByPriorityThenTitle(a: Task, b: Task): number {
    const priorityDiff =
      (b.priority ? this.priorityOrder(b.priority) : 0) -
      (a.priority ? this.priorityOrder(a.priority) : 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  }

  private priorityOrder(priority?: TaskPriority): number {
    const order: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priority ? order[priority] : 0;
  }

  private formatPriority(priority?: TaskPriority): string {
    const icons: Record<TaskPriority, string> = {
      critical: "🔴",
      high: "🟠",
      medium: "🟡",
      low: "🟢",
    };
    return priority ? icons[priority] : "—";
  }

  private formatStatus(status?: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
      todo: "📋",
      "in-progress": "⏳",
      blocked: "🚫",
      done: "✅",
    };
    return status ? icons[status] : "—";
  }

  private formatBlockerStatus(status: TaskStatus): string {
    const icons: Record<TaskStatus, string> = {
      todo: "⚠️",
      "in-progress": "⏳",
      blocked: "🚫",
      done: "✅",
    };
    return icons[status];
  }

  private formatTaskLink(task: Task): string {
    const linkPath = this.makeRelativeLink(task.filePath);
    return `[${task.title}](${linkPath})`;
  }

  private formatInitiativeLink(initiative: Initiative): string {
    const linkPath = this.makeRelativeLink(initiative.filePath);
    return `[${initiative.title}](${linkPath})`;
  }

  /**
   * Convert absolute file path to relative path from _views/ directory
   */
  private makeRelativeLink(absolutePath: string): string {
    if (!this.sourcePath) {
      return absolutePath;
    }

    const viewsDir = `${this.sourcePath}/_views`;
    const relativePath = relative(viewsDir, absolutePath);

    return relativePath;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

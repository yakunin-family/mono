#!/usr/bin/env node

import { access, constants, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Collector } from "./collector.js";
import { Generator } from "./generator.js";
import { parseArgs } from "./utils.js";

/**
 * Compile the dashboard, documents, and error files
 */
async function compile(sourcePath: string): Promise<void> {
  const collector = new Collector(sourcePath);
  const generator = new Generator();
  generator.setSourcePath(sourcePath);

  console.log("Collecting tasks, documents, and initiatives...");

  const { tasks, documents, initiatives, warnings, validationErrors } =
    await collector.collect();

  console.log(
    `   Found ${tasks.length} tasks, ${documents.length} documents, and ${initiatives.length} initiatives`
  );

  if (warnings.length > 0) {
    console.log();
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`   ${warning}`);
    }
  }

  console.log("Generating views...");

  const dashboard = generator.generateDashboard(tasks, initiatives, documents);
  const documentsView = generator.generateDocumentsView(documents);
  const errors = generator.generateErrors(validationErrors);

  const outputDir = join(resolve(sourcePath), "_views");
  await mkdir(outputDir, { recursive: true });

  const dashboardPath = join(outputDir, "dashboard.md");
  await writeFile(dashboardPath, dashboard, "utf-8");
  console.log(`   Generated ${dashboardPath}`);

  const documentsPath = join(outputDir, "documents.md");
  await writeFile(documentsPath, documentsView, "utf-8");
  console.log(`   Generated ${documentsPath}`);

  const errorsPath = join(outputDir, "errors.md");
  await writeFile(errorsPath, errors, "utf-8");
  console.log(`   Generated ${errorsPath}`);

  const agentsGuidePath = join(resolve(sourcePath), "agents.md");
  try {
    await access(agentsGuidePath, constants.F_OK);
  } catch {
    const agentsGuide = generator.generateAgentsGuide();
    await writeFile(agentsGuidePath, agentsGuide, "utf-8");
    console.log("Generated agents.md");
  }

  const completedTasks = tasks.filter((t) => t.status === "done");
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const blockedTasks = tasks.filter((t) => t.status === "blocked");

  console.log();
  console.log(`Generated dashboard with ${tasks.length} tasks and ${documents.length} documents`);
  console.log(
    `   ${activeTasks.length} active, ${completedTasks.length} completed, ${blockedTasks.length} blocked`
  );

  if (blockedTasks.length > 0) {
    console.log(`   ${blockedTasks.length} tasks are blocked`);
  }

  if (validationErrors.length > 0) {
    console.log();
    console.log(
      `${validationErrors.length} validation error(s) found. See ${errorsPath} for details.`
    );
    process.exit(1);
  }
}

/**
 * Generate agents guide file (force regeneration)
 */
async function generateAgentsGuide(sourcePath: string): Promise<void> {
  const generator = new Generator();

  console.log("Generating agents guide...");

  const agentsGuide = generator.generateAgentsGuide();
  const agentsGuidePath = join(resolve(sourcePath), "agents.md");

  await writeFile(agentsGuidePath, agentsGuide, "utf-8");

  console.log(`   Generated ${agentsGuidePath}`);
}

/**
 * CLI entry point for the project management tool
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args.command || "compile";
  const sourcePath = resolve(args.source || "./project-management");

  const validCommands = ["compile", "generate-agents-guide"];
  if (!validCommands.includes(command)) {
    console.error(`Project Management Tool`);
    console.error();
    console.error(`Unknown command: ${command}`);
    console.error();
    console.error("Available commands:");
    console.error("  compile               - Generate dashboard, documents, and errors views");
    console.error("  generate-agents-guide - Regenerate agents.md from template");
    console.error();
    console.error("Options:");
    console.error("  --source <path>  - Source directory (default: ./project-management)");
    process.exit(1);
  }

  console.log(`Project Management Tool`);
  console.log(`Source: ${sourcePath}`);
  console.log();

  try {
    if (command === "compile") {
      await compile(sourcePath);
    } else if (command === "generate-agents-guide") {
      await generateAgentsGuide(sourcePath);
    }
  } catch (error) {
    console.error();
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

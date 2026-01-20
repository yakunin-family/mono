#!/usr/bin/env node

import { access, constants, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Collector } from "./collector.js";
import { Generator } from "./generator.js";
import { parseArgs } from "./utils.js";

/**
 * Build the dashboard and archive files
 */
async function build(sourcePath: string): Promise<void> {
  const collector = new Collector(sourcePath);
  const generator = new Generator();
  generator.setSourcePath(sourcePath);

  console.log("🔍 Collecting tasks and initiatives...");

  const { tasks, initiatives, warnings, validationErrors } =
    await collector.collect();

  console.log(
    `   Found ${tasks.length} tasks and ${initiatives.length} initiatives`
  );

  if (warnings.length > 0) {
    console.log();
    console.log("⚠️  Warnings:");
    for (const warning of warnings) {
      console.log(`   ${warning}`);
    }
  }

  console.log("📝 Generating dashboard...");

  const dashboard = generator.generateDashboard(tasks, initiatives);
  const errors = generator.generateErrors(validationErrors);

  const outputDir = join(resolve(sourcePath), "_views");
  await mkdir(outputDir, { recursive: true });

  const dashboardPath = join(outputDir, "dashboard.md");
  await writeFile(dashboardPath, dashboard, "utf-8");
  console.log(`   ✓ Generated ${dashboardPath}`);

  const errorsPath = join(outputDir, "errors.md");
  await writeFile(errorsPath, errors, "utf-8");
  console.log(`   ✓ Generated ${errorsPath}`);

  const agentsGuidePath = join(resolve(sourcePath), "agents.md");
  try {
    await access(agentsGuidePath, constants.F_OK);
  } catch {
    const agentsGuide = generator.generateAgentsGuide();
    await writeFile(agentsGuidePath, agentsGuide, "utf-8");
    console.log("📝 Generated agents.md");
  }

  const completedTasks = tasks.filter((t) => t.status === "done");
  const activeTasks = tasks.filter((t) => t.status !== "done");
  const blockedTasks = tasks.filter((t) => t.status === "blocked");

  console.log();
  console.log(`✓ Generated dashboard with ${tasks.length} tasks`);
  console.log(
    `   ${activeTasks.length} active, ${completedTasks.length} completed, ${blockedTasks.length} blocked`
  );

  if (blockedTasks.length > 0) {
    console.log(`   ⚠️  ${blockedTasks.length} tasks are blocked`);
  }

  if (validationErrors.length > 0) {
    console.log();
    console.log(
      `❌ ${validationErrors.length} validation error(s) found. See ${errorsPath} for details.`
    );
  }
}

/**
 * Generate agents guide file (force regeneration)
 */
async function generateAgentsGuide(sourcePath: string): Promise<void> {
  const generator = new Generator();

  console.log("📝 Generating agents guide...");

  const agentsGuide = generator.generateAgentsGuide();
  const agentsGuidePath = join(resolve(sourcePath), "agents.md");

  await writeFile(agentsGuidePath, agentsGuide, "utf-8");

  console.log(`   ✓ Generated ${agentsGuidePath}`);
}

/**
 * Watch mode - rebuild dashboard when files change
 */
async function watch(sourcePath: string): Promise<void> {
  const collector = new Collector(sourcePath);

  console.log("👀 Watching for changes...");
  console.log("   Press Ctrl+C to stop");
  console.log();

  await build(sourcePath);

  let isBuilding = false;

  collector.watch(async () => {
    if (isBuilding) return;

    isBuilding = true;
    console.log();
    console.log("📝 Detected changes, regenerating...");

    try {
      await build(sourcePath);
    } catch (error) {
      console.error("Error during rebuild:", error);
    } finally {
      isBuilding = false;
    }
  });
}

/**
 * CLI entry point for the project management tool
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args.command || "build";
  const sourcePath = resolve(args.source || "./project-management");

  const validCommands = ["build", "watch", "generate-agents-guide"];
  if (!validCommands.includes(command)) {
    console.error(`📋 Project Management Tool`);
    console.error();
    console.error(`❌ Unknown command: ${command}`);
    console.error();
    console.error("Available commands:");
    console.error("  build                 - Generate dashboard once and exit");
    console.error("  watch                 - Watch for changes and regenerate automatically");
    console.error("  generate-agents-guide - Regenerate agents.md from template");
    console.error();
    console.error("Options:");
    console.error("  --source <path>  - Source directory (default: ./project-management)");
    process.exit(1);
  }

  console.log(`📋 Project Management Tool`);
  console.log(`📂 Source: ${sourcePath}`);
  console.log();

  try {
    if (command === "build") {
      await build(sourcePath);
    } else if (command === "watch") {
      await watch(sourcePath);
    } else if (command === "generate-agents-guide") {
      await generateAgentsGuide(sourcePath);
    }
  } catch (error) {
    console.error();
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

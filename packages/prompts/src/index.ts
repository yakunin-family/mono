import { fillTemplate } from "./builder.js";
import { TEMPLATES } from "./templates.js";

// Export builder functions with type-safe interfaces

export interface ValidationPromptVars {
  userPrompt: string;
  previousClarifications?: string;
}

export function buildValidationPrompt(vars: ValidationPromptVars): string {
  const template = TEMPLATES["validate-requirements"];
  if (!template) {
    throw new Error("Template 'validate-requirements' not found");
  }
  return fillTemplate(template, vars);
}

export interface PlanningPromptVars {
  requirements: string;
}

export function buildPlanningPrompt(vars: PlanningPromptVars): string {
  const template = TEMPLATES["plan-exercises"];
  if (!template) {
    throw new Error("Template 'plan-exercises' not found");
  }
  return fillTemplate(template, vars);
}

export interface GenerationPromptVars {
  requirements: string;
  approvedPlan: string;
  exerciseItem: string;
}

export function buildGenerationPrompt(vars: GenerationPromptVars): string {
  const template = TEMPLATES["generate-exercises"];
  if (!template) {
    throw new Error("Template 'generate-exercises' not found");
  }
  return fillTemplate(template, vars);
}

// Re-export utilities for advanced use cases
export { fillTemplate } from "./builder.js";

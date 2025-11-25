import { PARTIALS } from "./templates.js";

/**
 * Simple template engine that replaces {{variable}} with values
 * and handles {{>partial}} includes. Compatible with Convex runtime.
 *
 * @param template - Template string with {{variable}} placeholders
 * @param vars - Object containing variable values
 * @returns Filled template string
 */
export function fillTemplate(
  template: string,
  vars: Record<string, any>
): string {
  let result = template;

  // First, replace all partials {{>partialName}}
  result = result.replace(/\{\{>\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, partialName) => {
    const partial = PARTIALS[partialName];
    if (!partial) {
      console.warn(`Partial '${partialName}' not found`);
      return match;
    }
    return partial;
  });

  // Then, replace all variables {{variableName}}
  result = result.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, varName) => {
    const value = vars[varName];
    if (value === undefined || value === null) {
      console.warn(`Variable '${varName}' not found in vars`);
      return match;
    }
    return String(value);
  });

  return result;
}

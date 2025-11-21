import Handlebars from "handlebars";
import { PARTIALS } from "./templates.js";

// Register all partials
for (const [name, content] of Object.entries(PARTIALS)) {
  Handlebars.registerPartial(name, content);
}

/**
 * Fills a template string using Handlebars template engine
 *
 * @param template - Handlebars template string
 * @param vars - Object containing variable values
 * @returns Filled template string
 */
export function fillTemplate(
  template: string,
  vars: Record<string, any>
): string {
  const compiled = Handlebars.compile(template);
  return compiled(vars);
}

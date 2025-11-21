import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Read all .hbs files from templates directory
const templatesDir = join(process.cwd(), "templates");
const templateFiles = readdirSync(templatesDir).filter((file) =>
  file.endsWith(".hbs")
);

// Read all .hbs files from templates/partials directory
const partialsDir = join(templatesDir, "partials");
const partialFiles = existsSync(partialsDir)
  ? readdirSync(partialsDir).filter((file) => file.endsWith(".hbs"))
  : [];

// Generate TypeScript code with template constants
let output = "// Auto-generated file - do not edit manually\n\n";

// Generate TEMPLATES
output += "export const TEMPLATES: Record<string, string> = {\n";

for (const file of templateFiles) {
  const content = readFileSync(join(templatesDir, file), "utf-8");
  const name = file.replace(".hbs", "");

  // Escape backticks and ${} in template content
  const escaped = content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

  output += `  "${name}": \`${escaped}\`,\n`;
}

output += "};\n\n";

// Generate PARTIALS
output += "export const PARTIALS: Record<string, string> = {\n";

for (const file of partialFiles) {
  const content = readFileSync(join(partialsDir, file), "utf-8");
  const name = file.replace(".hbs", "");

  // Escape backticks and ${} in template content
  const escaped = content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

  output += `  "${name}": \`${escaped}\`,\n`;
}

output += "};\n";

// Write to src/templates.ts
const outputPath = join(process.cwd(), "src", "templates.ts");
writeFileSync(outputPath, output, "utf-8");

console.log(`✓ Generated ${templateFiles.length} templates and ${partialFiles.length} partials`);

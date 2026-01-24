import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const promptsDir = join(process.cwd(), "prompts");

// Read all partials
const partialsDir = join(promptsDir, "partials");
const partials: Record<string, string> = {};

for (const file of readdirSync(partialsDir)) {
  if (file.endsWith(".md")) {
    const name = file.replace(".md", "");
    partials[name] = readFileSync(join(partialsDir, file), "utf-8");
  }
}

// Function to replace partials in content
function replacePartials(content: string): string {
  return content.replace(/\{>([a-zA-Z0-9_-]+)\}/g, (match, partialName) => {
    const partial = partials[partialName];
    if (!partial) {
      console.warn(`Warning: Partial '${partialName}' not found`);
      return match;
    }
    return partial;
  });
}

// Special handling for known optional sections
const OPTIONAL_SECTIONS: Record<string, string> = {
  previousClarifications: `
## Previous Clarifications

The user has already provided these answers:

{previousClarifications}
`,
};

// Function to convert markdown to TypeScript function
function generateFunction(
  name: string,
  content: string,
  variables: { name: string; optional: boolean }[],
): string {
  // Replace partials first
  content = replacePartials(content);

  // Escape backticks and ${ for template literals
  content = content.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  // Handle optional sections
  for (const [varName, section] of Object.entries(OPTIONAL_SECTIONS)) {
    const escapedSection = section
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${")
      .replace(/\{([a-zA-Z0-9_-]+)\}/g, "${vars.$1}");

    content = content.replace(
      new RegExp(`\\{${varName}\\}`, "g"),
      `\${vars.${varName} ? \`${escapedSection}\` : ""}`,
    );
  }

  // Replace remaining {variableName} placeholders
  content = content.replace(/\{([a-zA-Z0-9_-]+)\}/g, "${vars.$1}");

  // Generate interface
  const interfaceProps = variables
    .map((v) => `  ${v.name}${v.optional ? "?" : ""}: string;`)
    .join("\n");

  const interfaceName = toPascalCase(name) + "Vars";

  return `
export interface ${interfaceName} {
${interfaceProps}
}

export function ${name}(vars: ${interfaceName}): string {
  return \`${content}\`;
}
`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// Read and process each prompt
const promptFiles: Array<{
  name: string;
  content: string;
  vars: Array<{ name: string; optional: boolean }>;
}> = [
  {
    name: "buildValidationPrompt",
    content: readFileSync(
      join(promptsDir, "validate-requirements.md"),
      "utf-8",
    ),
    vars: [
      { name: "userPrompt", optional: false },
      { name: "previousClarifications", optional: true },
    ],
  },
  {
    name: "buildPlanningPrompt",
    content: readFileSync(join(promptsDir, "plan-exercises.md"), "utf-8"),
    vars: [{ name: "requirements", optional: false }],
  },
  {
    name: "buildGenerationPrompt",
    content: readFileSync(join(promptsDir, "generate-exercises.md"), "utf-8"),
    vars: [
      { name: "requirements", optional: false },
      { name: "approvedPlan", optional: false },
      { name: "exerciseItem", optional: false },
    ],
  },
  {
    name: "buildAutoTagPrompt",
    content: readFileSync(
      join(promptsDir, "auto-tag-library-item.md"),
      "utf-8",
    ),
    vars: [{ name: "content", optional: false }],
  },
  {
    name: "buildDocumentEditorChatPrompt",
    content: readFileSync(join(promptsDir, "document-editor-chat.md"), "utf-8"),
    vars: [
      { name: "documentXml", optional: false },
      { name: "conversationHistory", optional: false },
      { name: "instruction", optional: false },
    ],
  },
];

// Generate simple getter functions for skills (no variables)
function generateSimpleGetter(name: string, content: string): string {
  // Escape backticks and ${ for template literals
  const escaped = content.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  return `
export function ${name}(): string {
  return \`${escaped}\`;
}
`;
}

// Load chat skills
const chatSkillsDir = join(promptsDir, "chat", "skills");
const chatSkills: Array<{ name: string; content: string }> = [];

if (existsSync(chatSkillsDir)) {
  for (const file of readdirSync(chatSkillsDir)) {
    if (file.endsWith(".md")) {
      const skillName = file.replace(".md", "");
      // Convert kebab-case to camelCase: fill-blanks -> FillBlanks
      const camelName = skillName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
      chatSkills.push({
        name: `getSkill${camelName}`,
        content: readFileSync(join(chatSkillsDir, file), "utf-8"),
      });
    }
  }
}

// Load chat base prompt
const chatBaseFile = join(promptsDir, "chat", "base.md");
let chatBasePrompt = "";
if (existsSync(chatBaseFile)) {
  chatBasePrompt = readFileSync(chatBaseFile, "utf-8");
}

// Generate output
let output = `// Auto-generated from markdown files in prompts/
// Run: pnpm build:prompts
// DO NOT EDIT THIS FILE DIRECTLY - Edit the markdown files instead

`;

for (const { name, content, vars } of promptFiles) {
  output += generateFunction(name, content, vars);
}

// Add chat base prompt
if (chatBasePrompt) {
  output += generateSimpleGetter("getChatBasePrompt", chatBasePrompt);
}

// Add skill getters
for (const { name, content } of chatSkills) {
  output += generateSimpleGetter(name, content);
}

// Add skill names constant for type safety
if (chatSkills.length > 0) {
  const skillNames = chatSkills.map((s) => {
    // Extract original kebab-case name from function name
    // getSkillFillBlanks -> fill-blanks
    const withoutPrefix = s.name.replace("getSkill", "");
    return withoutPrefix
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .slice(1); // Remove leading dash
  });
  output += `
export const CHAT_SKILL_NAMES = [${skillNames.map((n) => `"${n}"`).join(", ")}] as const;
export type ChatSkillName = typeof CHAT_SKILL_NAMES[number];
`;
}

// Write output
const outputPath = join(process.cwd(), "convex", "_generated_prompts.ts");
writeFileSync(outputPath, output, "utf-8");

console.log(`✓ Generated prompts from ${promptFiles.length} markdown files`);
console.log(`  + ${chatSkills.length} chat skill functions`);
console.log(`  + getChatBasePrompt function`);
console.log(`  Output: convex/_generated_prompts.ts`);

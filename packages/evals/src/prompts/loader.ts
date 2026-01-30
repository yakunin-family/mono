import * as fs from "fs";
import * as path from "path";
import { load as yamlLoad } from "js-yaml";

export type PromptMeta = {
  id: string;
  fileName: string;
  title?: string;
  skill?: string;
  instruction?: string;
  body: string;
};

const PROMPTS_DIR = path.resolve(__dirname, "../../prompts");

function parseFrontmatter(content: string): { meta: any; body: string } {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (fmMatch) {
    const fm: string = (fmMatch[1] as string) ?? "";
    const body: string = (fmMatch[2] as string) ?? "";
    try {
      const meta = (yamlLoad as any)(fm) as any;
      return { meta: meta || {}, body };
    } catch (e) {
      // If frontmatter parse fails, treat as no frontmatter
      return { meta: {}, body: content };
    }
  }
  return { meta: {}, body: content };
}

function loadPromptFromFile(filePath: string): PromptMeta {
  const content = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(content);
  const rel = path.relative(PROMPTS_DIR, filePath);
  const parsed = path.parse(rel);
  const defaultId = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name;
  const id = meta?.id || defaultId;
  return {
    id,
    fileName: rel,
    title: meta?.title,
    skill: meta?.skill,
    instruction: meta?.instruction,
    body: body.trim(),
  };
}

export function listPrompts(): PromptMeta[] {
  if (!fs.existsSync(PROMPTS_DIR)) return [];

  const out: PromptMeta[] = [];

  function walk(dir: string) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (/\.md$|\.yaml$|\.yml$/i.test(f)) out.push(loadPromptFromFile(p));
    }
  }

  walk(PROMPTS_DIR);
  return out;
}

export async function getPrompt(idOrPath: string): Promise<PromptMeta | null> {
  // If it looks like a path and exists, load directly
  if (idOrPath.includes(path.sep) || path.isAbsolute(idOrPath)) {
    const p = path.isAbsolute(idOrPath)
      ? idOrPath
      : path.resolve(PROMPTS_DIR, idOrPath);
    if (fs.existsSync(p)) return loadPromptFromFile(p);
    // try adding .md
    if (fs.existsSync(p + ".md")) return loadPromptFromFile(p + ".md");
  }

  // Otherwise search by id
  const list = listPrompts();
  const found = list.find(
    (x) =>
      x.id === idOrPath ||
      x.fileName === idOrPath ||
      path.parse(x.fileName).name === idOrPath,
  );
  return found ?? null;
}

export const promptLoader = { list: listPrompts, get: getPrompt };

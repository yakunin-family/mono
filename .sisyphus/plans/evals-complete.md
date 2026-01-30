# Plan: Finish and integrate packages/evals (revised)

## TL;DR

Make packages/evals a manual playground focused on running agent evals locally. Key work: copy backend prompts into the package (manual one-off), extend the existing CLI to accept prompt IDs/paths for agent runs, wire the CLI to the existing runAgent implementation, add a lightweight optional doctor that uses the editor's validateXML utility for XML checks, remove obsolete fixtures safely, and add the monorepo eslint config.

Deliverables (concise):

- `packages/evals/prompts/` — manually copied prompt files from `apps/backend/prompts` (no auto-sync)
- Minimal CLI extension: `packages/evals/src/cli/index.ts` — extend existing commands to accept `--prompt <id|path>` for agent runs
- Optional prompt loader helper: `packages/evals/src/prompts/loader.ts` (simple runtime reader)
- `doctor` (optional): uses `validateXML` from `@package/editor/src/serialization/validate-xml.ts` to validate XML fixtures
- Delete obsolete fixtures (safe workflow)
- Add ESLint config that extends the repo shared config (e.g., `tooling/eslint`)

Estimated Effort: Short (small edits to CLI + copy prompts + linter config) → Medium if doctor and fixture discovery are implemented.

Critical Path: manual prompt copy → extend CLI to accept prompts → run agent with existing runAgent → verify outputs

---

## Context & decisions from interview

- The user clarified that the CLI should primarily execute agent evals; they do not want extensive automation for prompts. Copying prompts from backend is a manual one-off. No sync mechanism.
- Use existing agent runtime: `packages/evals/src/agent/runAgent` (exported as `runAgent` function) and the repo's AI gateway configuration (set `AI_GATEWAY_API_KEY` locally) for real runs.
- XML canonical definitions: use `packages/editor/src/serialization/validate-xml.ts` (importable via `import { validateXML } from '@package/editor/src/serialization'`) for doctor checks.
- Linter: extend existing monorepo shared config (e.g., `tooling/eslint`). Follow other packages for exact extend path.
- Test strategy: manual verification — the package is a local playground.

Metis/Momus status: Momus reviewed earlier draft and requested more precise specs. This revision reconciles with existing in-repo code (extends current CLI rather than replacing it), defines the prompt-policy (manual copy, add `copied-from` marker), points to exact XML validator to call, and clarifies the agent provider/env expectation.

---

## Work Objectives (revised)

Core Objective: Deliver a minimal, reliable manual playground where the developer can run agent evaluations using prompts copied from the backend and the existing agent runtime.

Concrete deliverables:

- Documented manual copy step and marker file in `packages/evals/prompts/`
- Extend `packages/evals/src/cli/index.ts` so `agent` (or `run`) accepts `--prompt <id|path>` and loads the prompt if present
- Use existing `runAgent(documentXml, instruction, skill?)` in `packages/evals/src/agent/index.ts` as the execution core
- Optional: `packages/evals/src/prompts/loader.ts` implementing `list()` and `get(id)` as a small helper
- Optional: `doctor` command that calls `validateXML(xml)` from `@package/editor/src/serialization/validate-xml.ts` for fixture checks
- Delete unused fixture files safely following a candidate+approval workflow
- Add `.eslintrc.js` extending `tooling/eslint` (or the repo's shared eslint package)

### Implementation specifics (required clarifications)

To address Momus's review, the following unambiguous rules are required and included here. Implementers must follow these exactly unless the author (you) approves changes.

1. Prompt file rules (canonical mapping and extraction)

- Location: all playground prompt files live under `packages/evals/prompts/`.
- ID → file mapping: A prompt id resolves to `packages/evals/prompts/{id}.md` where `{id}` may contain slashes to denote subdirectories. Examples:
  - id `greeting` → `packages/evals/prompts/greeting.md`
  - id `chat/skills/fill-blanks` → `packages/evals/prompts/chat/skills/fill-blanks.md`
- Instruction extraction rules (deterministic):
  1. If the file contains YAML frontmatter and an `instruction` field, use that string as the instruction.
  - Frontmatter parsing: use `js-yaml` to parse YAML frontmatter bounded by `---` at the top of the file. On parse errors treat as if frontmatter is absent (log a warning).
  2. Otherwise, use the full Markdown body with leading H1/H2 headers removed and trimmed whitespace as the instruction string.
  3. If the frontmatter defines `skill: <skillName>` and `<skillName>` matches one of `ChatSkillName` (see `packages/evals/src/agent/prompts.ts`), pass that as the `skill` argument to `runAgent`.

Example prompt file (`packages/evals/prompts/greeting.md`):

```md
---
id: greeting
title: Friendly greeting
skill: writing-exercises
---

Please write a friendly two-sentence greeting appropriate for elementary-level learners.
```

`loader.get('greeting')` must return `{ id: 'greeting', meta: {...}, body: 'Please write a friendly...' }` and caller maps `body` → `instruction` and `meta.skill` → `skill` when calling `runAgent`.

Additional rule: if the prompt file contains a frontmatter `id` value that differs from the filename, the frontmatter `id` is authoritative; implementers must use that id as the canonical id.

2. CLI precedence & merging rule

- The CLI accepts `--prompt <id|path>` and `--instruction "..."`.
- Precedence rule (deterministic):
  - If both are present, finalInstruction = `${promptInstruction}\n\nUser instruction: ${instruction}` (i.e., prompt content first, then the explicit instruction). Implementer must implement this exact merge rule.
  - If only `--prompt` is provided, use prompt-derived instruction. If only `--instruction` is provided, use it directly.

3. Prompt loader API (exact contract)

- File: `packages/evals/src/prompts/loader.ts` (optional helper). Export these functions:
  ```ts
  export type PromptMeta = {
    id: string;
    fileName: string;
    title?: string;
    skill?: string;
    instruction?: string; // optional: frontmatter-provided instruction
  };
  export type PromptFile = { meta: PromptMeta; body: string };
  export function list(): Promise<PromptMeta[]>;
  export function get(id: string): Promise<PromptFile | null>;
  ```
- Example usage (pseudo-code for CLI handler):
  ```ts
  const promptOrPath = options.prompt;
  let promptFile;
  if (isPath(promptOrPath)) promptFile = readFile(promptOrPath);
  else promptFile = await loader.get(promptOrPath);
  const instruction =
    promptFile.meta.instruction ?? extractBody(promptFile.body);
  const skill = promptFile.meta.skill as ChatSkillName | undefined;
  const result = await runAgent(documentXml, instruction, skill);
  console.log(JSON.stringify(result));
  ```

3a) CLI errors & edge-case behavior

- isPath detection: treat the `--prompt` argument as a path when `path.isAbsolute(arg)` is true OR when `arg` contains a path separator (`/` or `\`) and `fs.existsSync(arg)` is true. Otherwise treat it as a prompt id.
- Missing prompt handling: if a prompt id is supplied and `loader.get(id)` returns `null`, the CLI must print a helpful error message: `Prompt not found: <id>` and exit with code 3.
- Frontmatter vs filename conflicts: if a file's frontmatter defines an `id` that differs from its filename, the frontmatter `id` is authoritative.

4. Doctor JSON schema & exit codes

- Doctor must output a JSON object of the form:
  ```json
  {
    "valid": boolean,
    "errors": [ { "path": "string", "message": "string", "severity": "info|warning|critical" } ],
    "summary": { "checked": number, "errors": number }
  }
  ```
- Exit codes:
  - 0 → valid === true and errors.length === 0
  - 2 → any error with severity === "critical" present
  - 1 → parse or unexpected runtime error

Mapping `validateXML` → doctor errors:

- `validateXML(xml)` returns `{ valid: boolean, error?: string }`.
- If `valid === false` and `error` is present, the doctor should append an object `{ path: fixturePath, message: validateXML.error, severity: "critical" }` to the `errors` array in the output JSON.

This deterministic mapping ensures doctor output is machine-parseable and consistent across fixtures.

5. Fixture deletion approval workflow (exact steps)

- Discovery command (runs locally):

  ```bash
  # Produce a candidate list by searching for references to each fixture filename across the repo
  for f in packages/evals/fixtures/**/*.json; do
    name=$(basename "$f")
    refs=$(pnpm -w exec rg -n --hidden --no-ignore --no-heading --line-number "$name" || true)
    echo "$f|$(echo "$refs" | wc -l)"
  done > packages/evals/fixtures/deletion-candidates-raw.txt

  # Convert the raw output into a JSON schema (one-liner Node transform)
  node -e "const fs=require('fs');const lines=fs.readFileSync('packages/evals/fixtures/deletion-candidates-raw.txt','utf8').trim().split('\n').filter(Boolean);const candidates=lines.map(l=>{const [file,count]=l.split('|');return {file, referencesCount:+count};});fs.writeFileSync('packages/evals/fixtures/deletion-candidates.json',JSON.stringify({candidates},null,2));"
  ```

- `deletion-candidates.json` format: `{ "candidates": [ { "file": "path", "references": ["path1","path2"] } ] }`
- `deletion-candidates.json` format: `{ "candidates": [ { "file": "path", "referencesCount": 0 } ] }` (the `referencesCount` is an integer; implementer may optionally expand this into a list of referencing paths using ripgrep JSON output if desired)
- Approval file: `packages/evals/fixtures/deletion-approval.json` with schema `{ "approvedBy": "github-handle", "date": "YYYY-MM-DD", "files": ["path1","path2"] }`
- Deletion commit steps:
  1. Create branch `chore/evals-remove-fixtures` containing `deletion-approval.json` and the deletions
  2. Open PR and require one reviewer sign-off
  3. Merge and run post-merge doctor to ensure nothing broke

CLI & fixture resolution (deterministic rule):

- The CLI and any loader must resolve fixture and prompt files relative to the package directory (not process.cwd()). Use `path.resolve(__dirname, '../../fixtures', fixtureName)` (or equivalent) so the CLI can be invoked from the repo root without changing working directory. Implementers should NOT rely on process.cwd() to find fixtures.

ESLint extend example (copy pattern from an existing package):

```js
// packages/evals/.eslintrc.js
module.exports = {
  extends: ["../../tooling/eslint/base.js"],
};
```

`.copied` marker example (exact content):

```yaml
copied-from: apps/backend/prompts
copied-at: 2026-01-30T12:00:00Z
note: manual copy, no-sync
```

Preferred pnpm command (from repo root) to run the package script:

```bash
pnpm --filter @package/evals run evals:agent -- --fixture a2-daily-routine --prompt greeting
```

These specifics remove the guesswork Momus flagged. Implementers must follow these rules for the plan to be considered complete.

Definition of Done (DoD):

- `pnpm evals:agent --fixture <fixture> --instruction "..." --prompt <id|path>` runs locally and prints agent output; uses `AI_GATEWAY_API_KEY` if available
- Prompt files exist under `packages/evals/prompts` with a `.copied` marker file documenting origin
- Deleted fixture files are captured in a single commit with approval file in the repo
- ESLint config present and follows monorepo pattern

---

## Minimal Implementation Plan (step-by-step)

1. Manual copy prompts (one-off)

- Instruction: Copy `apps/backend/prompts/*` → `packages/evals/prompts/`.
- Add marker: create `packages/evals/prompts/.copied` containing: `copied-from: apps/backend/prompts @ <date>`.

2. Extend CLI (small code edits)

- Edit `packages/evals/src/cli/index.ts` (existing file). Add an optional `--prompt <id|path>` to the existing `agent` command handler.
- Behavior: if `--prompt` is provided and resolves to a file under `packages/evals/prompts`, read the prompt (YAML frontmatter or raw body) and pass the prompt content as the `instruction` parameter to `runAgent` (or as an additional parameter as appropriate). If `--prompt` is an id, use a small helper to find the file by id (filename or frontmatter id).

3. Use existing agent runtime

- Call the existing exported `runAgent(documentXml, instruction, skill?)` from `packages/evals/src/agent/index.ts`. This function currently uses `streamText` and the `ai` package and expects environment variable `AI_GATEWAY_API_KEY` for live runs.

4. Optional prompt loader helper

- Implement `packages/evals/src/prompts/loader.ts` with the `PromptLoader` contract (list()/get(id)). This is optional — CLI can inline the minimal logic if preferred.

5. Optional doctor

- Implement a small check that imports `validateXML` from `@package/editor/src/serialization` and runs it against a chosen fixture. Doctor should output a JSON summary and exit non-zero on critical errors.

6. Fixtures deletion (safe workflow)

- Use the candidate discovery commands in the prior plan section to create `packages/evals/fixtures/deletion-candidates.json` and follow the approval+commit process.

7. Linter

- Add `.eslintrc.js` that extends the shared config. Mirror an existing package in the monorepo for exact extend path and package.json script conventions.

---

## Acceptance & Manual Verification (how you test locally)

1. After copying prompts and extending CLI:

- Run: `pnpm evals:agent --fixture a2-daily-routine --instruction "create blanks" --prompt greeting`
- Expected: CLI prints a JSON object containing an `output` string and an `ok`-style status. The exact schema can reuse the existing `AgentResult` from `packages/evals/src/agent/index.ts` (it returns { output, toolCalls, usage }).

2. Doctor (optional):

- Run: `pnpm evals:doctor` (or `node ./packages/evals/dist/index.js doctor`) and inspect JSON output. Use `validateXML` from `@package/editor/src/serialization/validate-xml.ts` internally.

3. Fixtures deletion verification: ensure deletion commit lists removed files and `git show --name-only HEAD` includes them.

---

## TODOs (revised & minimal)

- [ ] Document and perform manual prompt copy
- [ ] Extend `packages/evals/src/cli/index.ts` with `--prompt` option for `agent` (minimal code change)
- [ ] Ensure `runAgent` usage is wired to the CLI path and document AI env requirement
- [ ] Add `.eslintrc.js` extending monorepo config
- [ ] (Optional) Implement `packages/evals/src/prompts/loader.ts` and `doctor` command
- [ ] (Optional) Run fixture discovery and remove approved files in one commit

---

## Why this approach

- Minimal disruption: It adapts the existing CLI and agent runtime rather than replacing them.
- Manual-first: fits the user's desire for a playground that they iterate on locally.
- Safe: avoids automated cross-repo sync and enforces an approval workflow for destructive fixture deletions.

---

## Next steps

1. Confirm you accept this revised plan (minimal CLI extension + manual copy + linter + optional doctor).
2. If accepted, I will: (a) update plan metadata and (b) optionally produce a concise patch-style plan diff showing exact edits to `packages/evals/src/cli/index.ts` and a tiny example of `packages/evals/src/prompts/loader.ts` (this diff is advisory; I will not commit changes).
3. If you request a high-accuracy Momus re-review after the changes, I will resubmit the file to Momus and iterate until OKAY.

Plan saved to: `.sisyphus/plans/evals-complete.md`

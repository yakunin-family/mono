# Plan: Migrate prompts into @package/ai-agent

TL;DR
Move backend/Convex prompt text and tool/skill descriptions into `@package/ai-agent`. Implement a compile step that emits TypeScript artifacts (ToolRegistry, SkillRegistry) plus Zod validators and TypeScript types. Artifacts are produced at build-time by ai-agent (not committed). Update backend Convex files to import from ai-agent in a single migration PR.

Deliverables

- `packages/ai-agent/src/prompts/` — prompt sources
- `packages/ai-agent/bin/compile-prompts` — CLI to compile sources
- Generated outputs (build-time): `packages/ai-agent/dist/generated/tool-registry.ts`, `skill-registry.ts`, and generated Zod schemas/types
- Updated backend files under `apps/backend/convex/` to import registries

Scope

- IN: `@package/ai-agent` (new prompts + compile step), `apps/backend/convex/*` files listed in the draft (documentEditor.ts, \_generated_prompts.ts, evalHelpers.ts, chat.ts, playground.ts)
- OUT: `packages/evals` (explicitly excluded), apps/teacher frontend (deferred)

Key Decisions (already confirmed)

- Consolidation target: `@package/ai-agent`
- Export shape: ToolRegistry = Record<string, { description: string; args: ArgDef[] }>
- SkillRegistry = Record<string, { prompt: string }>
- ArgDef = { name:string; type:string; required:boolean; description?:string; default?:any }
- Validators: Zod runtime schemas + generated TypeScript types
- Artifact policy: generated at build-time (do NOT commit generated artifacts)

Execution Strategy

Wave 1 — Foundation (parallelizable)

1. Design prompt source format and Tool/Skill schema (YAML/MD/TS source format decision)
2. Implement codegen core: parse sources → produce ToolRegistry/SkillRegistry TS modules + Zod schemas/types
3. Add compile CLI: `pnpm --filter=@package/ai-agent run compile-prompts`

Wave 2 — Integration 4. Hook compile step into monorepo build (turbo/pnpm scripts) so ai-agent compile runs before apps/backend build 5. Replace hardcoded prompt strings in backend files with imports from generated modules

Wave 3 — Verification & polish 6. Run monorepo build to verify backend compiles 7. Add small smoke command: `pnpm -w --filter=@package/ai-agent compile-prompts && pnpm -w turbo build --filter=apps/backend`

Dependency & Blocking Items

- Need to pick canonical path for generated artifacts (e.g., `packages/ai-agent/dist/generated/`).
- Ensure monorepo build graph runs compile step first (turbo task ordering).
- Convex import resolution: generated TS must be compiled and packaged into the backend deploy artifact.

TODOs (high-level)

- [ ] Design prompt source format and example prompts (ai-agent)
- [ ] Implement parser & codegen that emits ToolRegistry + SkillRegistry + Zod schemas
- [ ] Implement CLI and package.json scripts
- [ ] Integrate compile step into monorepo build (turbo/pnpm)
- [ ] Migrate backend files to import generated registries
- [ ] Run full build + fix type errors
- [ ] Final review and documentation

Acceptance Criteria

- `pnpm -w --filter=@package/ai-agent run compile-prompts` produces generated TS modules at agreed path.
- Running the monorepo build completes with no TypeScript errors for `apps/backend`.
- All backend Convex functions import prompts/tools from the generated modules and behavior is preserved.

Verification Commands (agent-executable)

- Compile prompts: `pnpm -w --filter=@package/ai-agent run compile-prompts`
- Build backend: `pnpm -w turbo build --filter=apps/backend`
- Smoke-check: `pnpm -w --filter=@package/ai-agent run compile-prompts && pnpm -w turbo build --filter=apps/backend`

Notes & Risks

- Zod runtime validators add code size; keep validators server-side only. (We are not migrating frontend now.)
- Generating artifacts at build-time requires CI/build reliability—if CI doesn't run compile step, backend builds will fail.
- Because generated artifacts are not checked in, ensure easy local developer workflow: add a dev script that runs compile-prompts automatically.

Next steps (immediate)

1. I will mark plan generation todos as in_progress and produce this plan file (done).
2. If you want high-accuracy review (Momus) or CI test enforcement, tell me and I'll add Momus loop to iterate until OKAY.

Plan saved: `.sisyphus/plans/prompts-migration-ai-agent.md`

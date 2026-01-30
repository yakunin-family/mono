# ai-agent

This package centralizes prompt sources (tools and skills) and provides a small compile step that emits TypeScript registries and Zod validators.

Run:

```
pnpm --filter=@package/ai-agent run compile-prompts
```

Prompts live in `src/prompts/` and should use YAML frontmatter for metadata.

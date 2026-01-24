---
status: todo
priority: high
description: Update build-prompts.ts to generate skill functions and chat base prompt
tags: [ai, prompts]
references: blocked-by:t-102
---

# Update build-prompts.ts for skill generation

Extend the prompt build script to generate TypeScript functions for the chat skills and base prompt.

## Requirements

1. Process `prompts/chat/base.md` to generate `buildChatBasePrompt()` function
2. Process `prompts/chat/skills/*.md` to generate skill functions:
   - `getSkillFillBlanks()`
   - `getSkillMultipleChoice()`
   - `getSkillTrueFalse()`
   - `getSkillSequencing()`
   - `getSkillShortAnswer()`
   - `getSkillWritingExercises()`
3. Follow existing pattern in build-prompts.ts for template generation
4. Ensure skills are available as TypeScript functions at runtime
5. Add skill name mapping for the loadSkill tool to use

## Files

- `apps/backend/scripts/build-prompts.ts`
- `apps/backend/convex/_generated/prompts.ts` (generated output)

## Acceptance Criteria

- [ ] Running `pnpm build:prompts` generates all skill functions
- [ ] Generated functions are type-safe
- [ ] Skills can be imported and called in agent definition
- [ ] Skill mapping object exported for tool validation

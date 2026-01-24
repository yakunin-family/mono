---
status: todo
priority: high
description: Create base prompt and skill markdown files for document editor chat
tags: [ai, prompts]
---

# Create base prompt and skill markdown files

Create the prompt infrastructure for the document editor chat agent.

## Requirements

1. Create `prompts/chat/base.md` with minimal base prompt:
   - Define the agent's role as a document editing assistant
   - Explain it can load specialized skills when needed
   - Describe the XML document format it works with
   - Keep it concise - skills contain detailed instructions

2. Create skill files in `prompts/chat/skills/`:
   - `fill-blanks.md` - Instructions for creating fill-in-the-blank exercises
   - `multiple-choice.md` - Instructions for creating MCQ exercises
   - `true-false.md` - Instructions for creating true/false exercises
   - `sequencing.md` - Instructions for creating sequencing exercises
   - `short-answer.md` - Instructions for creating short answer exercises
   - `writing-exercises.md` - Instructions for writing/composition exercises

3. Adapt content from existing `prompts/generate-exercises.md` where applicable

## Files

- `apps/backend/prompts/chat/base.md`
- `apps/backend/prompts/chat/skills/fill-blanks.md`
- `apps/backend/prompts/chat/skills/multiple-choice.md`
- `apps/backend/prompts/chat/skills/true-false.md`
- `apps/backend/prompts/chat/skills/sequencing.md`
- `apps/backend/prompts/chat/skills/short-answer.md`
- `apps/backend/prompts/chat/skills/writing-exercises.md`

## Acceptance Criteria

- [ ] Base prompt defines agent role and capabilities
- [ ] Each skill file contains detailed instructions for that exercise type
- [ ] Content adapted from existing generate-exercises.md where applicable
- [ ] Files follow consistent markdown format

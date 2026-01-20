---
status: done
priority: high
description: Update backend schema and AI prompt to use unnumbered blanks
tags: [backend, ai]
---

# Update Backend for Unnumbered Blanks

## Objective

Update the backend schema and AI prompt to use unnumbered `[[blank]]` placeholders without any numbered IDs that could confuse the AI.

## Rationale

Any reference to numbered blanks (even in the `id` field) could confuse the AI and cause it to sometimes add numbers to the sentence placeholders. We'll use position-based mapping instead, which is more reliable.

## Files Modified

- `/apps/backend/convex/validators/exerciseGeneration.ts` - Remove `id` from blank object
- `/apps/backend/prompts/generate-exercises.md` - Change to unnumbered `[[blank]]`
- `/packages/editor/src/types/exerciseGeneration.ts` - Remove `id` from FillBlanksBlank type

## Acceptance Criteria

- [x] Backend schema updated: blank object has no `id` field
- [x] Prompt updated: all examples use `[[blank]]` (no numbers)
- [x] Multi-blank example added to prompt
- [x] Guidelines explicitly say "no numbers"
- [x] Frontend types match backend schema
- [x] Prompts rebuilt successfully
- [x] No TypeScript errors

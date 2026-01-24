---
status: todo
priority: high
description: Create markdown skill files for each exercise type
tags: [ai, editor, streaming]
---

# Create skill files for exercise types

Create detailed markdown skill files for each exercise type that the AI can load on demand.

## Files to Create

All files go in `apps/backend/prompts/chat/skills/`:

1. **`fill-blanks.md`** - Fill-in-the-blank exercises
   - XML structure with `<blank>` element
   - Attributes: `answer`, `alts`, `hint`, `student-answer`
   - Guidelines for context and difficulty
   - Common mistakes to avoid

2. **`multiple-choice.md`** - Multiple choice questions
   - XML structure with options
   - Distractor guidelines
   - Question stem best practices

3. **`true-false.md`** - True/false statements
   - XML structure
   - Statement writing guidelines
   - Avoiding obvious answers

4. **`sequencing.md`** - Ordering/sequencing exercises
   - XML structure for ordered items
   - Use cases (chronological, procedural, logical)

5. **`short-answer.md`** - Open-ended questions
   - XML structure
   - Question types
   - Expected answer guidelines

6. **`writing-exercises.md`** - Writing prompts
   - XML structure with `<writing-area>`
   - Prompt types (opinion, description, narrative)
   - Word count and assessment guidance

## Content Source

Adapt detailed specifications from existing `apps/backend/prompts/generate-exercises.md` where applicable.

## File Template

```markdown
# [Exercise Type] Rules

## XML Structure

[Show complete XML example]

## Attributes

[List and explain each attribute]

## Guidelines

1. [Guideline 1]
2. [Guideline 2]
   ...

## Examples

[Good and bad examples]

## Common Mistakes to Avoid

- [Mistake 1]
- [Mistake 2]
```

## Acceptance Criteria

- [ ] All 6 skill files created
- [ ] Each file has XML structure with examples
- [ ] Guidelines are clear and actionable
- [ ] Content is adapted from existing prompts where applicable
- [ ] Files follow consistent template structure

---
status: todo
priority: high
description: Update base prompt with skill loading instructions and available skills list
tags: [ai, editor, streaming]
references: blocked-by:t-95, blocked-by:t-96
---

# Update base prompt for skill loading

Update the base system prompt to include instructions for when to use `load_skill` and list available skills.

## Requirements

1. Update `apps/backend/prompts/chat/base.md`
2. Add instruction: "Always load the relevant skill before creating exercises"
3. List all available skills with brief descriptions
4. Clarify the relationship between skills and exercise creation

## Content to Add

### When to Load Skills

```markdown
## When to Load Skills

Before creating any exercise, you MUST use `load_skill` to get the detailed rules. This ensures:

- Correct XML structure
- Proper attribute usage
- Quality content guidelines

Example flow:

1. User asks for a fill-in-the-blank exercise
2. You call `load_skill("fill-blanks")`
3. You receive detailed instructions
4. You call `edit_document` with properly formatted XML
```

### Available Skills

```markdown
## Available Skills

| Skill               | Use For                                       |
| ------------------- | --------------------------------------------- |
| `fill-blanks`       | Exercises with missing words students fill in |
| `multiple-choice`   | Questions with 4 answer options               |
| `true-false`        | Statements students evaluate as true or false |
| `sequencing`        | Items students put in correct order           |
| `short-answer`      | Open-ended questions with brief responses     |
| `writing-exercises` | Longer writing prompts with word counts       |
```

## File

`apps/backend/prompts/chat/base.md`

## Acceptance Criteria

- [ ] Base prompt instructs AI to always load skills before exercises
- [ ] All 6 skills are listed with descriptions
- [ ] Example flow shows correct tool call sequence
- [ ] AI understands skill → edit_document workflow

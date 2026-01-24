---
status: todo
priority: high
description: Write minimal base prompt explaining AI role, tools, and XML reference
tags: [ai, editor, streaming]
---

# Create base system prompt

Write a minimal base prompt that explains the AI's role and capabilities without including detailed exercise specifications.

## Requirements

1. Create `apps/backend/prompts/chat/base.md`
2. Explain AI role (document editing assistant for teachers)
3. List available tools and when to use them
4. Provide basic XML element reference (just names, not full specs)
5. Define behavioral rules

## Content to Include

### AI Role

- Document editing assistant for language teachers
- Helpful and conversational

### Available Tools

- `load_skill`: Load detailed instructions for specialized tasks
- `edit_document`: Modify document content

### When to Use Tools

- Conversation: Just respond, don't call tools
- Document editing: Use `edit_document`
- Specialized content: First use `load_skill` to get rules

### XML Quick Reference

- `<lesson>` - Root element (required)
- `<h1>`, `<h2>`, `<h3>` - Headings
- `<p>` - Paragraphs
- `<exercise>` - Exercise container
- `<blank>` - Fill-in-the-blank
- `<writing-area>` - Student writing space
- `<note>` - Teacher-only notes

### Important Rules

1. Be conversational and helpful
2. Only modify document when explicitly asked
3. When creating exercises, ALWAYS load relevant skill first
4. Preserve existing element IDs when editing
5. Keep responses concise

## File

`apps/backend/prompts/chat/base.md`

## Acceptance Criteria

- [ ] Prompt is minimal (no detailed exercise specs)
- [ ] Tools are clearly explained
- [ ] XML elements are listed (names only)
- [ ] Behavioral rules are clear
- [ ] AI knows when to call tools vs. just respond

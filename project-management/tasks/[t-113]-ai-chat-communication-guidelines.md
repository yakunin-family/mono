---
status: todo
priority: medium
description: Establish guidelines for user-friendly AI communication in chat
tags: [feature, ai, chat, ux, prompts]
---

# Guidelines for AI Communication in Chat

The AI should communicate in a non-technical, user-friendly way. Need to establish and implement guidelines for how the AI communicates with users in the chat interface.

## Problem

Teachers using the document editor AI assistant may not be technical users. The AI needs to communicate in an approachable, helpful manner that:

- Avoids technical jargon and programming terminology
- Uses friendly, conversational language
- Provides clear, actionable guidance
- Doesn't overwhelm users with unnecessary details

## Solution

Create and implement communication guidelines for the AI assistant that ensure all interactions are user-friendly and appropriate for educators.

## Guidelines to Establish

### Tone & Style

- Use warm, friendly language
- Be concise but not curt
- Explain actions in plain language (e.g., "I'll add a new section" not "I'll insert a node")
- Acknowledge user requests before acting

### Avoiding Jargon

- No programming terms (nodes, DOM, API, etc.)
- No technical editor terminology unless contextually appropriate
- Translate technical concepts into user-friendly language

### Response Structure

- Keep responses focused and scannable
- Use markdown formatting to improve readability (once t-112 is implemented)
- Lead with the most important information
- Offer follow-up questions when appropriate

### Error Communication

- Explain issues in plain language
- Offer solutions or alternatives
- Never show technical error messages directly

## Implementation

- Update the system prompt in the document editor agent
- Add communication guidelines to the prompt/skill files
- Consider adding example interactions for few-shot learning

## Acceptance Criteria

- [ ] System prompt includes clear communication guidelines
- [ ] AI responses avoid technical jargon
- [ ] Tone is consistently friendly and approachable
- [ ] Error messages are user-friendly
- [ ] Guidelines documented for future prompt updates

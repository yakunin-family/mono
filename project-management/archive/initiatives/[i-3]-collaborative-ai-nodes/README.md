---
status: done
priority: low
description: Design for handling role-based visibility of AI generation nodes
tags: [editor, collaboration, design-doc]
---

# Collaborative AI Nodes Initiative

## Overview

Design document for handling role-based visibility of AI generation nodes in the collaborative editor.

**Status: Design Only** - This was a design document that informed implementation decisions. No separate implementation tasks were created.

## Context

Tiptap collaborative editor with teacher and student roles. AI generation nodes are interactive tools for teachers but not relevant for students.

## Problem

- AI generation nodes are tool UI, not document content
- Showing placeholders to students creates confusion and wasted space
- Need to maintain awareness features (live cursors) without breaking UX

## Recommended Solution

**Hide AI nodes completely from students** (client-side filtering)

- Treat as editing tool, not shared content (like permission-based sidebar features)
- Teachers see full interactive node
- Students don't render it at all (use comment node or skip rendering)
- Avoids "ghost" elements students can't interact with

## Cursor/Awareness Handling

When teacher cursor is in/near AI node:

- **Option 1:** Don't show teacher cursor to students in that region
- **Option 2:** Show cursor at nearest visible position
- **Option 3:** Display global indicator ("Teacher is using AI tools")

## Implementation Notes

- Use `addNodeView()` with role check in node extension
- Return comment node or null DOM for student view
- Filter cursor positions in collaboration plugin based on role
- Ensure generated content (if any) appears normally in shared document

## Open Questions

- Does AI generation produce content that appears in student view?
- Should students see any indication teacher is generating content?
- How to handle selection ranges that span AI nodes?

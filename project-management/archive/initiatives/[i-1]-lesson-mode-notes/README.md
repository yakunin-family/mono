---
status: done
priority: medium
description: Add editable note blocks to collaborative editor for teacher annotations
tags: [editor, tiptap, abandoned]
---

# Lesson Mode Notes Initiative

## Overview

Add note blocks to the collaborative document editor that allow teachers to insert ad-hoc annotations during lessons. These notes are editable by both teachers and students, while the main lesson content remains read-only in lesson mode.

**Status: Abandoned** - This initiative was deprioritized in favor of other features.

## Problem

Teachers need a way to add contextual notes, annotations, and comments during live lessons without switching back to full editor mode. Currently, in lesson mode, all content except interactive elements (blanks, exercises) is read-only, making it impossible for teachers to add supplementary information on the fly.

## Solution

Implement a special "note block" node type in Tiptap that:
- Can only be created by teachers (via UI controls)
- Can be edited by both teachers and students
- Is visually distinct from main lesson content (yellow background, icon)
- Can contain any standard block content (paragraphs, lists, etc.)
- Exists at the top level only (no nesting)
- Is always editable via `contentEditable={true}` attribute

## Tasks

- [t-1] Create NoteBlock Extension - Core Tiptap node extension
- [t-2] Create NoteBlockView Component - React NodeView with contentEditable
- [t-3] Add Note Block Styling - CSS for visual distinction
- [t-4] Implement Note Insertion UI - Toolbar button for inserting notes
- [t-5] Register Extension in Editor - Integration into DocumentEditor
- [t-6] Test Note Block Behavior - Manual testing and verification

## Key Files

**Files to Create:**
- `packages/editor/src/extensions/NoteBlock.ts` - Extension definition
- `packages/editor/src/extensions/NoteBlockView.tsx` - React component
- `packages/editor/src/styles/note-block.css` - Styling
- `packages/editor/src/components/InsertNoteButton.tsx` - UI for inserting notes

**Files to Modify:**
- `packages/editor/src/extensions/index.ts` - Export new extension
- `packages/editor/src/DocumentEditor.tsx` - Register extension and add insert UI

---
status: done
priority: low
description: Design for showing who else is viewing the document
tags: [editor, collaboration, design-doc]
---

# Multiplayer Cursor Awareness Initiative

## Overview

Design document for implementing live cursor and presence awareness in the collaborative editor.

**Status: Design Only** - This was a design document. Implementation was handled as part of the editor setup.

## Problem

When multiple users are in the same document:
- Can't see who else is viewing/editing
- No indication of where others are working
- Potential for conflicting edits without awareness

## Solution

Use Hocuspocus/Yjs collaboration features to show:
- Live cursors with user names
- Presence indicators (who's online)
- Selection highlighting

## Implementation Notes

Tiptap's CollaborationCursor extension handles most of this:

```typescript
CollaborationCursor.configure({
  provider: hocuspocusProvider,
  user: {
    name: currentUser.name,
    color: generateUserColor(currentUser.id),
  },
})
```

## Features

1. **Live Cursors**
   - Colored caret with user name label
   - Different color per user
   - Fades after inactivity

2. **Selection Highlighting**
   - See what others have selected
   - Semi-transparent highlight in user's color

3. **Presence List**
   - Show avatars of active users
   - "3 people viewing" indicator
   - Expandable to see names

## Technical Details

- Built into Hocuspocus provider
- Yjs awareness protocol
- Updates ~100ms debounce
- Color generation from user ID hash

## Status

This was a design exploration. The actual implementation was straightforward using Tiptap's built-in extensions and was completed as part of the editor package setup.

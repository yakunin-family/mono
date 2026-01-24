---
status: todo
priority: medium
description: Add error handling, edge cases, and remove deprecated files
tags: [editor, cleanup]
references: blocked-by:t-108, t-109
---

# Error handling and cleanup

Handle error cases, edge cases, and clean up deprecated code.

## Error Handling

1. Handle tool failures in UI:
   - Show error state in tool result component
   - Display error message to user
   - Allow retry if appropriate

2. Handle stream interruptions:
   - Detect disconnection
   - Show appropriate message
   - Allow user to retry

3. Handle malformed XML from editDocument tool:
   - Catch parsing errors
   - Show error without crashing
   - Log for debugging

4. Handle authentication errors:
   - Redirect to login if session expired
   - Show appropriate message

## Cleanup - Remove Deprecated Files

1. Remove old validators:
   - `convex/validators/chat.ts` (if exists)

2. Remove old prompts:
   - `prompts/document-editor-chat.md` (if exists)

3. Remove old hooks:
   - `use-chat.ts` (old implementation)
   - `use-ai-document-edit.ts` (if exists)

4. Clean up old schema:
   - Review if old chat tables can be removed
   - If data exists, consider migration or archival
   - Document any kept legacy tables

## Edge Cases

1. Empty document handling
2. Very long conversations (pagination?)
3. Rapid message sending
4. Multiple tabs with same document

## Acceptance Criteria

- [ ] Tool failures show clear error messages
- [ ] Stream interruptions handled gracefully
- [ ] XML parsing errors don't crash the app
- [ ] Deprecated files removed
- [ ] No unused imports or dead code
- [ ] Edge cases documented or handled

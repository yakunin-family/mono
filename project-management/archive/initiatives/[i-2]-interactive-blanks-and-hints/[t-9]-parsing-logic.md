---
status: done
priority: high
description: Update exercise conversion to parse [[blank]] placeholders
tags: [parser, conversion]
references: blocked-by:t-7, blocked-by:t-8
---

# Parsing Logic - AI to Blank Nodes

## Objective

Update the exercise conversion logic to parse `[[blank]]` placeholders and convert them to Blank nodes with proper metadata mapping.

## Files Modified

- `/packages/editor/src/utils/exerciseToTiptap.ts` - Updated fillBlanksToTiptap function

## Key Changes

1. Change regex from `/\{\{blank\}\}/g` to `/\[\[blank\]\]/g`
2. Map blanks by position: 1st `[[blank]]` → `item.blanks[0]`, 2nd → `item.blanks[1]`
3. Store `blankIndex` for tracking position
4. Remove separate hint paragraph generation
5. Add question numbering directly in paragraph content

## Acceptance Criteria

- [x] AI-generated fill-in-the-blank exercises parse correctly
- [x] `[[blank]]` placeholders converted to Blank nodes
- [x] Correct answer, alternatives, and hints mapped from metadata
- [x] Multiple blanks in one sentence handled correctly
- [x] Question numbering appears (1., 2., 3., etc.)
- [x] No separate hint paragraphs

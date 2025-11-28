# Task 2: Parsing Logic - AI to Blank Nodes

## Objective
Update the exercise conversion logic to parse `[[blank]]` placeholders and convert them to Blank nodes with proper metadata mapping.

## Prerequisites
- Task 0: Update Backend Prompt (must be complete - ensures AI outputs `[[blank]]`)
- Task 1: Blank Node Foundation (must be complete)

## Files to Modify

### `/packages/editor/src/utils/exerciseToTiptap.ts`

**Function: `fillBlanksToTiptap()` (lines 163-211)**

#### Current Issue
- Line 178 uses regex `/\{\{blank\}\}/g` (double curly braces)
- AI outputs `[[blank]]` (double square brackets)
- Regex doesn't match, so blanks stay as literal text `[[blank]]`
- Hints show as separate italic paragraphs (lines 191-208)

#### Changes Needed

Replace the entire `fillBlanksToTiptap()` function:

```typescript
function fillBlanksToTiptap(ex: FillBlanksExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  ex.items.forEach((item, idx) => {
    const parts: JSONContent[] = [];
    let lastIndex = 0;
    const regex = /\[\[blank\]\]/g;
    let match;
    let blankIndex = 0;

    while ((match = regex.exec(item.sentence)) !== null) {
      // Add text before blank
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          text: item.sentence.slice(lastIndex, match.index)
        });
      }

      // Get metadata by position (order in array matches order in sentence)
      const metadata = item.blanks[blankIndex] || {
        id: `blank${blankIndex}`,
        correctAnswer: "",
        alternativeAnswers: [],
        hint: null
      };

      // Add blank node
      parts.push({
        type: "blank",
        attrs: {
          blankIndex: blankIndex,
          correctAnswer: metadata.correctAnswer,
          alternativeAnswers: metadata.alternativeAnswers || [],
          hint: metadata.hint || null,
          studentAnswer: ""
        }
      });

      blankIndex++;
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < item.sentence.length) {
      parts.push({
        type: "text",
        text: item.sentence.slice(lastIndex)
      });
    }

    // Wrap in paragraph with question number
    nodes.push({
      type: "paragraph",
      content: [
        { type: "text", text: `${idx + 1}. ` },
        ...parts
      ]
    });
  });

  return nodes;
}
```

#### Key Changes
1. Change regex from `/\{\{blank\}\}/g` to `/\[\[blank\]\]/g`
2. Map blanks by position: 1st `[[blank]]` → `item.blanks[0]`, 2nd → `item.blanks[1]`
3. Store `blankIndex` for tracking position
4. Remove separate hint paragraph generation (old lines 191-208)
5. Add question numbering directly in paragraph content

## Acceptance Criteria
- [ ] AI-generated fill-in-the-blank exercises parse correctly
- [ ] `[[blank]]` placeholders converted to Blank nodes (not plain text)
- [ ] Correct answer, alternatives, and hints mapped from metadata
- [ ] Multiple blanks in one sentence handled correctly
- [ ] Question numbering appears (1., 2., 3., etc.)
- [ ] No separate hint paragraphs (hints embedded in blank nodes)
- [ ] No TypeScript errors

## Testing Steps
1. Generate a fill-in-the-blank exercise via AI
2. Accept the generated exercise
3. Verify `[[blank]]` placeholders are converted to Blank nodes
4. Verify blanks render with placeholder text (from Task 1)
5. Test sentence with multiple blanks: "The cat is [[blank]] on the [[blank]]"
6. Verify each blank gets correct metadata (1st blank → blanks[0], 2nd → blanks[1])
7. Check that hints are not showing as separate paragraphs

## Edge Cases to Handle
- Sentence with no blanks (should just render as text)
- More `[[blank]]` placeholders than metadata entries (use fallback)
- Fewer `[[blank]]` placeholders than metadata entries (extra metadata ignored)
- Blank at start of sentence: "[[blank]] is the answer"
- Blank at end of sentence: "The answer is [[blank]]"
- Adjacent text: "word[[blank]]word" (no spaces)

## Notes
- This task makes AI-generated content use proper editor primitives
- Hints are now embedded in blank attributes, not visible yet
- Actual hint display comes in Task 4

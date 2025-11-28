# Task 0: Update Backend for Unnumbered Blanks

## Objective
Update the backend schema and AI prompt to use unnumbered `[[blank]]` placeholders without any numbered IDs that could confuse the AI.

## Prerequisites
None - this should be done FIRST before any frontend work

## Rationale
Any reference to numbered blanks (even in the `id` field) could confuse the AI and cause it to sometimes add numbers to the sentence placeholders. We'll use position-based mapping instead, which is more reliable.

## Files to Modify

### 1. `/apps/backend/convex/validators/exerciseGeneration.ts`

**Lines 121-132 - Fill Blanks Schema**

**BEFORE:**
```typescript
// Fill in the Blanks Exercise
export const fillBlanksItemSchema = z.object({
  id: z.string(),
  sentence: z.string(), // Contains [[blank1]], [[blank2]] etc. placeholders
  blanks: z.array(
    z.object({
      id: z.string(),
      correctAnswer: z.string(),
      alternativeAnswers: z.array(z.string()).optional(),
      hint: z.string().optional(),
    }),
  ),
});
```

**AFTER:**
```typescript
// Fill in the Blanks Exercise
export const fillBlanksItemSchema = z.object({
  id: z.string(),
  sentence: z.string(), // Contains [[blank]] placeholders (unnumbered)
  blanks: z.array(
    z.object({
      correctAnswer: z.string(),
      alternativeAnswers: z.array(z.string()).optional(),
      hint: z.string().optional(),
    }),
  ),
});
```

**Changes:**
- Line 123: Update comment to `[[blank]]` (unnumbered)
- Line 126: **Remove** `id: z.string(),` from blank object
- Blanks are mapped by position: 1st `[[blank]]` → `blanks[0]`, 2nd → `blanks[1]`

### 2. `/apps/backend/prompts/generate-exercises.md`

**Lines 92-122 - Fill in the Blanks Section**

**BEFORE (lines 94-115):**
```markdown
**Output Format:**
```json
{
  "type": "fill-blanks",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "items": [
    {
      "id": "fb1",
      "sentence": "The cat is [[blank1]] on the sofa.",
      "blanks": [
        {
          "id": "blank1",
          "correctAnswer": "sleeping",
          "alternativeAnswers": ["resting", "lying"],
          "hint": "Present continuous verb (optional)"
        }
      ]
    }
  ]
}
```
```

**AFTER:**
```markdown
**Output Format:**
```json
{
  "type": "fill-blanks",
  "title": "Exercise title",
  "instructions": "Instructions in target language",
  "items": [
    {
      "id": "fb1",
      "sentence": "The cat is [[blank]] on the sofa.",
      "blanks": [
        {
          "correctAnswer": "sleeping",
          "alternativeAnswers": ["resting", "lying"],
          "hint": "Present continuous verb (optional)"
        }
      ]
    }
  ]
}
```
```

**Changes:**
- Line 103: `[[blank1]]` → `[[blank]]`
- Lines 105-106: Remove `"id": "blank1",` from blank object

**BEFORE (line 118):**
```markdown
**Guidelines:**
- Use `[[blank1]]`, `[[blank2]]` as placeholders
```

**AFTER:**
```markdown
**Guidelines:**
- Use only `[[blank]]` as the placeholder (no numbers!)
- Each `[[blank]]` in the sentence maps to the blanks array by position
  - First `[[blank]]` → blanks[0]
  - Second `[[blank]]` → blanks[1]
  - etc.
```

**Add after line 121 (before the horizontal rule):**
```markdown

**Example with multiple blanks:**
```json
{
  "id": "fb2",
  "sentence": "Yesterday I [[blank]] to the store and [[blank]] some milk.",
  "blanks": [
    {
      "correctAnswer": "went",
      "alternativeAnswers": ["walked", "drove"],
      "hint": "Past tense of 'go'"
    },
    {
      "correctAnswer": "bought",
      "alternativeAnswers": ["purchased", "got"],
      "hint": "Past tense of 'buy'"
    }
  ]
}
```

**Important:** The order of blanks in the sentence must match the order in the blanks array!
```

### 3. Frontend Type Definitions

**`/packages/editor/src/types/exerciseGeneration.ts`**

Lines 124-129 need updating to match backend:

**BEFORE:**
```typescript
export interface FillBlanksBlank {
  id: string;
  correctAnswer: string;
  alternativeAnswers?: string[];
  hint?: string;
}
```

**AFTER:**
```typescript
export interface FillBlanksBlank {
  correctAnswer: string;
  alternativeAnswers?: string[];
  hint?: string;
}
```

**Remove:** `id: string;` field

## Build Steps

After modifying files:

### 1. Rebuild Prompts
```bash
cd apps/backend
pnpm build:prompts
```

This converts the markdown prompt to TypeScript in `convex/_generated_prompts.ts`.

### 2. Verify TypeScript Compiles
```bash
cd apps/backend
pnpm check-types
```

### 3. Verify Frontend Types
```bash
cd packages/editor
pnpm check-types
```

## Acceptance Criteria
- [ ] Backend schema updated: blank object has no `id` field
- [ ] Prompt updated: all examples use `[[blank]]` (no numbers)
- [ ] Multi-blank example added to prompt
- [ ] Guidelines explicitly say "no numbers"
- [ ] Frontend types match backend schema
- [ ] Prompts rebuilt successfully
- [ ] No TypeScript errors in backend or frontend
- [ ] Comment on line 123 updated to reflect unnumbered format

## Testing Steps

### 1. Generate New Exercise
1. Start backend: `cd apps/backend && pnpm dev`
2. Start teacher app: `cd apps/teacher && pnpm dev`
3. Create a new fill-in-the-blank exercise via AI
4. Monitor backend console for AI request/response
5. Verify generated JSON matches new schema

### 2. Expected Output Example
```json
{
  "exercises": [
    {
      "planItemId": "ex1",
      "content": {
        "type": "fill-blanks",
        "title": "Past Tense Practice",
        "instructions": "Complete the sentences",
        "items": [
          {
            "id": "fb1",
            "sentence": "She [[blank]] her homework.",
            "blanks": [
              {
                "correctAnswer": "finished",
                "alternativeAnswers": ["completed"],
                "hint": "Past simple"
              }
            ]
          },
          {
            "id": "fb2",
            "sentence": "They [[blank]] to the beach and [[blank]] all day.",
            "blanks": [
              {
                "correctAnswer": "went",
                "alternativeAnswers": [],
                "hint": "Movement"
              },
              {
                "correctAnswer": "swam",
                "alternativeAnswers": ["played"],
                "hint": "Activity"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Verify:**
- ✅ Sentence uses `[[blank]]` (not `[[blank1]]`)
- ✅ Multiple blanks in same sentence all use `[[blank]]`
- ✅ No `id` field in blank objects
- ✅ Blanks array order matches sentence order

### 3. Validation
1. Check that AI doesn't add numbers (`[[blank1]]`)
2. Test with 1 blank, 2 blanks, 3+ blanks
3. Verify position mapping works correctly

## Notes

### Why Remove IDs Completely?
- Any reference to "blank1", "blank2" etc. could confuse the AI
- Position-based mapping is simpler and more reliable
- IDs aren't used anywhere - we map by array index
- Reduces chance of AI generating numbered placeholders

### Breaking Change
⚠️ **This is a breaking change:**
- Old exercises in database may have `id` field in blanks
- Old exercises may use `[[blank1]]` in sentences
- For MVP: regenerate exercises after this change
- For production: may need migration or backwards compatibility

### What About `fillBlanksItemSchema.id`?
- The `id` field in `fillBlanksItemSchema` (line 122) is kept
- This is for the item itself (like "fb1", "fb2"), not the blanks
- Only the blank object `id` is removed

## Dependencies Impact
✅ **This must complete BEFORE:**
- Task 1 (Blank Node Foundation)
- Task 2 (Parsing Logic) - frontend expects this format

❌ **If this isn't done:**
- New AI exercises will have wrong format
- Parser won't work correctly
- Frontend will receive `[[blank1]]` instead of `[[blank]]`

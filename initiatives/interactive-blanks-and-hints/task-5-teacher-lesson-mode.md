# Task 5: Teacher Lesson Mode - Validation & Peek

## Objective
Create the teacher lesson view that shows student answers with validation indicators and ability to peek at correct answers.

## Prerequisites
- Task 3: Student Mode (must be complete)
- Task 4: Hints System (must be complete)

## Files to Create

### `/packages/editor/src/utils/blankValidation.ts`

**Validation Logic:**
```typescript
/**
 * Validates a student answer against correct answer and alternatives.
 * Returns true if answer is correct (case-insensitive, trimmed).
 */
export function validateAnswer(
  studentAnswer: string,
  correctAnswer: string,
  alternativeAnswers: string[] = []
): boolean {
  const normalize = (str: string) => str.trim().toLowerCase();

  const student = normalize(studentAnswer);
  const correct = normalize(correctAnswer);
  const alternatives = alternativeAnswers.map(normalize);

  return student === correct || alternatives.includes(student);
}
```

### `/packages/editor/src/components/blank/TeacherLessonBlank.tsx`

**Component Interface:**
```typescript
interface TeacherLessonBlankProps {
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hint?: string | null;
}
```

**Functionality:**
- Read-only input showing `studentAnswer`
- Validation icon: ✓ (green) / ✗ (red) / ○ (gray for empty)
- Peek button/icon to reveal `correctAnswer` in tooltip
- Hint icon (reuse `HintTooltip` from Task 4)

**Example Structure:**
```tsx
import { Eye, Check, X, Circle } from "lucide-react";
import { HintTooltip } from "./HintTooltip";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@package/ui";

export function TeacherLessonBlank({
  studentAnswer,
  correctAnswer,
  isCorrect,
  hint
}: TeacherLessonBlankProps) {
  const isEmpty = !studentAnswer || studentAnswer.trim() === "";

  return (
    <span className="inline-flex items-center gap-1">
      {/* Validation Icon */}
      <span className="inline-flex h-4 w-4 items-center justify-center" contentEditable={false}>
        {isEmpty ? (
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
        ) : isCorrect ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <X className="h-3.5 w-3.5 text-red-600" />
        )}
      </span>

      {/* Read-only Input */}
      <input
        type="text"
        value={studentAnswer}
        readOnly
        disabled
        className="inline-block min-w-[100px] max-w-[300px] border-0 border-b-2 border-dashed border-gray-300 bg-gray-50 px-1 text-gray-700"
        style={{ width: `${Math.max(100, studentAnswer.length * 8 + 20)}px` }}
      />

      {/* Peek Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-blue-600 focus:outline-none"
              contentEditable={false}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              <span className="font-medium">Answer:</span> {correctAnswer}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Hint Icon */}
      {hint && <HintTooltip hint={hint} />}
    </span>
  );
}
```

## Files to Modify

### `/packages/editor/src/extensions/BlankView.tsx`

Update to use validation and teacher lesson component:

```tsx
import { validateAnswer } from "../utils/blankValidation";
import { StudentBlankInput } from "../components/blank/StudentBlankInput";
import { TeacherLessonBlank } from "../components/blank/TeacherLessonBlank";

export function BlankView({ node, editor, updateAttributes }: NodeViewProps) {
  const mode = editor.storage.editorMode || "student";
  const { blankIndex, correctAnswer, alternativeAnswers, hint, studentAnswer } = node.attrs;

  const isCorrect = validateAnswer(
    studentAnswer,
    correctAnswer,
    alternativeAnswers
  );

  return (
    <NodeViewWrapper as="span" className="inline-block">
      {mode === "student" && (
        <StudentBlankInput
          value={studentAnswer}
          onChange={(val) => updateAttributes({ studentAnswer: val })}
          hint={hint}
        />
      )}

      {mode === "teacher-lesson" && (
        <TeacherLessonBlank
          studentAnswer={studentAnswer}
          correctAnswer={correctAnswer}
          isCorrect={isCorrect}
          hint={hint}
        />
      )}

      {mode === "teacher-editor" && (
        <span className="text-muted-foreground">[Teacher Editor - Coming Soon]</span>
      )}
    </NodeViewWrapper>
  );
}
```

## Acceptance Criteria
- [ ] Teachers in lesson mode see student answers in read-only inputs
- [ ] Validation icon shows: ✓ green if correct, ✗ red if wrong, ○ gray if empty
- [ ] Validation updates in real-time as student types
- [ ] Peek (eye icon) reveals correct answer in tooltip
- [ ] Alternative answers accepted as correct
- [ ] Validation is case-insensitive
- [ ] Leading/trailing whitespace ignored in validation
- [ ] Hint icon shows when hint exists
- [ ] No TypeScript errors

## Testing Steps

### Correct Answer
1. Student fills blank with correct answer
2. Teacher views same document in lesson mode
3. Verify green ✓ appears
4. Hover over eye icon, verify tooltip shows correct answer

### Wrong Answer
1. Student fills blank with incorrect answer
2. Teacher views in lesson mode
3. Verify red ✗ appears
4. Hover over eye icon to see what correct answer should be

### Empty Blank
1. Student leaves blank empty
2. Teacher views in lesson mode
3. Verify gray ○ appears
4. Input shows empty state

### Alternative Answers
1. Create/find blank with alternative answers: ["sleeping", "resting", "lying"]
2. Student enters "resting"
3. Teacher sees green ✓ (alternative is accepted)

### Case Insensitive
1. Correct answer: "Sleeping"
2. Student enters: "sleeping"
3. Verify green ✓ (case doesn't matter)

### Real-Time Updates
1. Teacher and student open same document
2. Student starts typing answer
3. Teacher sees validation update character by character
4. Verify icon changes from ○ → ✗ → ✓ as student types

## Styling Notes
- Validation icons: 14px, positioned left of input
- Colors: Green (#16a34a), Red (#dc2626), Gray (#6b7280)
- Read-only input: Gray background, lighter border
- Peek icon: Gray default, blue on hover
- All icons should have `contentEditable={false}` attribute

## Notes
- This mode is for teachers viewing student progress during lessons
- No editing capability (that's in Task 6)
- Validation is purely frontend (no backend grading yet)
- Could extend validation with fuzzy matching in future

# Task 6: Teacher Editor Mode - Inline Badge Editing

## Objective
Create the teacher editor view with interactive badges that allow inline editing of correct answers.

## Prerequisites
- Task 4: Hints System (must be complete)
- Task 5: Teacher Lesson Mode (recommended but not required)

## Dependencies to Install

### In `/packages/ui`:
```bash
cd packages/ui
pnpx shadcn@latest add badge
```

## Files to Create

### `/packages/editor/src/components/blank/TeacherEditorBadge.tsx`

**Component Interface:**
```typescript
interface TeacherEditorBadgeProps {
  correctAnswer: string;
  alternativeAnswers: string[];
  hint?: string | null;
  onEdit: (newAnswer: string) => void;
}
```

**Functionality:**
- Badge displaying `correctAnswer` (blue/purple pill)
- Click badge → transforms to inline input
- Type to edit answer
- Blur/Enter → saves via `onEdit()`, reverts to badge
- Escape → cancels, reverts to badge without saving
- Hover shows alternatives in tooltip (if any)
- Hint icon adjacent (reuse `HintTooltip`)

**Example Structure:**
```tsx
import { useState, useRef, useEffect } from "react";
import { Badge } from "@package/ui";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@package/ui";
import { HintTooltip } from "./HintTooltip";

export function TeacherEditorBadge({
  correctAnswer,
  alternativeAnswers,
  hint,
  onEdit
}: TeacherEditorBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(correctAnswer);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== correctAnswer) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(correctAnswer);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const hasAlternatives = alternativeAnswers.length > 0;

  return (
    <span className="inline-flex items-center gap-1">
      {!isEditing ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setIsEditing(true)}
                contentEditable={false}
              >
                {correctAnswer}
              </Badge>
            </TooltipTrigger>
            {hasAlternatives && (
              <TooltipContent>
                <p className="text-sm">
                  <span className="font-medium">Alternatives:</span>{" "}
                  {alternativeAnswers.join(", ")}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="inline-block rounded border-2 border-blue-500 bg-white px-2 py-0.5 text-sm focus:outline-none"
          style={{ width: `${Math.max(60, editValue.length * 8 + 20)}px` }}
          contentEditable={false}
        />
      )}

      {hint && <HintTooltip hint={hint} />}
    </span>
  );
}
```

## Files to Modify

### `/packages/editor/src/extensions/BlankView.tsx`

Add teacher editor mode rendering:

```tsx
import { TeacherEditorBadge } from "../components/blank/TeacherEditorBadge";

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
        <TeacherEditorBadge
          correctAnswer={correctAnswer}
          alternativeAnswers={alternativeAnswers}
          hint={hint}
          onEdit={(newAnswer) => updateAttributes({ correctAnswer: newAnswer })}
        />
      )}
    </NodeViewWrapper>
  );
}
```

## Acceptance Criteria
- [ ] Teacher in editor mode sees badges instead of inputs
- [ ] Badge displays current correct answer
- [ ] Click badge to enter edit mode
- [ ] Input auto-focuses and selects text
- [ ] Type to change answer
- [ ] Enter key saves and returns to badge
- [ ] Blur (click outside) saves and returns to badge
- [ ] Escape key cancels and reverts to original answer
- [ ] Changed answer syncs via Yjs to all users
- [ ] Hover badge shows alternative answers (if any)
- [ ] Hint icon displays when hint exists
- [ ] No TypeScript errors

## Testing Steps

### Basic Edit
1. Open document in teacher-editor mode
2. Find a blank (shows as badge)
3. Click badge, verify it becomes input
4. Type new answer
5. Press Enter, verify badge shows new answer
6. Verify change persists on refresh

### Cancel Edit
1. Click badge to edit
2. Type new answer
3. Press Escape
4. Verify badge shows original answer (not changed)

### Blur to Save
1. Click badge to edit
2. Type new answer
3. Click outside input (anywhere in document)
4. Verify badge shows new answer

### Alternative Answers Tooltip
1. Find blank with alternative answers
2. Hover over badge
3. Verify tooltip shows "Alternatives: answer1, answer2, ..."

### Real-Time Sync
1. Teacher A edits answer in editor mode
2. Teacher B views same document in editor mode
3. Verify Teacher B sees updated answer in badge
4. Student C views same document in student mode
5. Verify Student C still sees input (not badge)

### Multiple Blanks
1. Sentence with multiple blanks shows multiple badges
2. Edit first badge
3. Tab/click to second badge
4. Edit second badge
5. Verify both changes persist

## Styling Notes
- Badge: Blue (#2563eb) background, white text
- Badge hover: Darker blue (#1d4ed8)
- Badge sizing: Compact padding (4px 8px)
- Edit input: Blue border (2px), white background
- Input width: Auto-expand like other inputs
- Border radius: Badge rounded (4px), input rounded (4px)

## Notes
- This is the primary authoring interface for teachers creating exercises
- Changes to `correctAnswer` sync via Yjs like student answers
- Could extend to edit alternative answers in future (modal/popover)
- Could extend to edit hints inline in future
- Badge cursor should indicate it's clickable (`cursor-pointer`)

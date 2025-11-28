# Task 3: Student Mode - Interactive Input

## Objective
Create the student-facing input component that allows students to type answers with real-time Yjs synchronization.

## Prerequisites
- Task 1: Blank Node Foundation (must be complete)
- Task 2: Parsing Logic (must be complete)

## Files to Create

### `/packages/editor/src/components/blank/StudentBlankInput.tsx`

**Component Interface:**
```typescript
interface StudentBlankInputProps {
  value: string;
  onChange: (value: string) => void;
  hint?: string | null;
}
```

**Functionality:**
- Text input field styled as fillable blank
- Controlled component (value + onChange)
- Auto-width: min 100px, max 300px, expand based on content
- Dashed underline styling (2px, blue/gray)
- Light blue tint on focus
- Inherit font from surrounding text
- No placeholder text (empty when blank)
- For now, ignore hint (will add in Task 4)

**Example Structure:**
```tsx
export function StudentBlankInput({ value, onChange, hint }: StudentBlankInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="inline-block min-w-[100px] max-w-[300px] border-0 border-b-2 border-dashed border-gray-400 bg-transparent px-1 focus:border-blue-500 focus:bg-blue-50 focus:outline-none"
      style={{ width: `${Math.max(100, value.length * 8 + 20)}px` }}
    />
  );
}
```

## Files to Modify

### `/packages/editor/src/extensions/BlankView.tsx`

**Current State:** Renders placeholder text

**Update to:**
```tsx
export function BlankView({ node, editor, updateAttributes }: NodeViewProps) {
  const mode = editor.storage.editorMode || "student";
  const { blankIndex, correctAnswer, alternativeAnswers, hint, studentAnswer } = node.attrs;

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
        <span className="text-muted-foreground">[Teacher Lesson - Coming Soon]</span>
      )}

      {mode === "teacher-editor" && (
        <span className="text-muted-foreground">[Teacher Editor - Coming Soon]</span>
      )}
    </NodeViewWrapper>
  );
}
```

## Acceptance Criteria
- [ ] Student sees input field where `[[blank]]` was
- [ ] Input is inline with surrounding text
- [ ] Student can type and see their answer
- [ ] Input width expands as student types
- [ ] Answer syncs in real-time via Yjs
- [ ] Teacher (in separate browser) sees student's answer update live
- [ ] Multiple students can work simultaneously (last write wins)
- [ ] Focus styling (blue border/background) works
- [ ] No TypeScript errors

## Testing Steps

### Single User
1. Open document in student mode
2. Find a fill-in-the-blank exercise
3. Click on a blank, verify cursor appears in input
4. Type an answer, verify text appears
5. Verify input expands as you type
6. Tab to next blank, verify focus moves

### Real-Time Sync
1. Open document in student mode in Browser A
2. Open same document in teacher mode in Browser B
3. Type answer in Browser A
4. Verify Browser B sees the answer update in real-time
5. Type in multiple blanks, verify all sync

### Multiple Blanks
1. Find sentence with multiple blanks
2. Fill in first blank
3. Tab or click to second blank
4. Fill in second blank
5. Verify both answers persist

## Styling Notes
- Use Tailwind classes for styling
- Border should be dashed, not solid
- Focus state should be visually distinct but not jarring
- Width calculation: `value.length * 8 + 20` (approximate character width)
- Consider using `ch` unit for more accurate width

## Notes
- This task makes blanks actually interactive for students
- Yjs handles synchronization automatically via `updateAttributes`
- No validation feedback yet (comes in Task 5)
- Hints not displayed yet (comes in Task 4)
- Teacher sees placeholder text until Tasks 5 & 6

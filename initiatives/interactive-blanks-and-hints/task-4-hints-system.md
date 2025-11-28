# Task 4: Hints System - Icon with Tooltip

## Objective
Replace plain text hints with an icon (💡) that shows hint text in a tooltip on hover/click.

## Prerequisites
- Task 3: Student Mode (must be complete)

## Dependencies to Install

### In `/packages/ui`:
```bash
cd packages/ui
pnpx shadcn@latest add tooltip
```

## Files to Create

### `/packages/editor/src/components/blank/HintTooltip.tsx`

**Component Interface:**
```typescript
interface HintTooltipProps {
  hint: string;
}
```

**Functionality:**
- Icon (💡 emoji or Lucide Lightbulb)
- Tooltip from shadcn/ui
- Hover shows tooltip (default behavior)
- Click keeps tooltip open (add state management)
- Click outside dismisses
- Max width: 200px
- Positioned adjacent to blank (right side)

**Example Structure:**
```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@package/ui";
import { Lightbulb } from "lucide-react";
import { useState } from "react";

export function HintTooltip({ hint }: HintTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-yellow-500 focus:outline-none"
            onClick={() => setOpen(!open)}
          >
            <Lightbulb className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p className="text-sm">{hint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Files to Modify

### `/packages/editor/src/components/blank/StudentBlankInput.tsx`

Add hint icon next to input:

```tsx
export function StudentBlankInput({ value, onChange, hint }: StudentBlankInputProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="inline-block min-w-[100px] max-w-[300px] border-0 border-b-2 border-dashed border-gray-400 bg-transparent px-1 focus:border-blue-500 focus:bg-blue-50 focus:outline-none"
        style={{ width: `${Math.max(100, value.length * 8 + 20)}px` }}
      />
      {hint && <HintTooltip hint={hint} />}
    </span>
  );
}
```

## Acceptance Criteria
- [ ] Hint icon (💡) appears next to blank inputs when hint exists
- [ ] No icon appears when hint is null/empty
- [ ] Hover shows tooltip with hint text
- [ ] Click toggles tooltip open/closed
- [ ] Tooltip dismisses when clicking outside
- [ ] Tooltip has max width of 200px (wraps long hints)
- [ ] Icon is visually distinct but not distracting (gray, yellow on hover)
- [ ] Works in all modes (student, teacher-lesson, teacher-editor)
- [ ] No TypeScript errors

## Testing Steps

### With Hint
1. Find a blank that has a hint (check AI-generated exercise)
2. Verify 💡 icon appears next to input
3. Hover over icon, verify tooltip appears with hint text
4. Click icon, verify tooltip stays open
5. Click outside, verify tooltip closes
6. Click icon again, verify tooltip reopens

### Without Hint
1. Find or create a blank without hint
2. Verify no icon appears
3. Input still works normally

### Long Hint Text
1. Create/find a blank with long hint (50+ characters)
2. Verify tooltip wraps text at max-width 200px
3. Verify text is readable

### Mobile/Touch
1. Test on touch device (if available)
2. Tap icon, verify tooltip appears
3. Tap outside, verify it dismisses

## Styling Notes
- Icon size: 14-16px (small, not distracting)
- Color: Gray (#9ca3af) default, yellow (#eab308) on hover
- Positioning: 4px margin-left from input
- Vertically center-aligned with input
- Use `contentEditable={false}` on button to prevent editor interaction

## Notes
- Hints now embedded in blank nodes (from Task 2)
- No more separate hint paragraphs cluttering the document
- Same hint display pattern will be reused in Tasks 5 & 6
- Consider extracting tooltip logic if reused elsewhere

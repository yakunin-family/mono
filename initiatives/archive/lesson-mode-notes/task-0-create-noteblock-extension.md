# Task 0: Create NoteBlock Extension

## Description
Create the core Tiptap extension for the note block node type with proper TypeScript types and configuration.

## Files to Create
- `packages/editor/src/extensions/NoteBlock.ts`

## Implementation

Create a new file `packages/editor/src/extensions/NoteBlock.ts`:

```typescript
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NoteBlockView } from "./NoteBlockView";

export const NoteBlock = Node.create({
  name: "noteBlock",

  group: "block",

  content: "block+",

  // Prevent notes inside notes
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="note-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "note-block",
      }),
      0, // 0 means "render content here"
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteBlockView);
  },

  addCommands() {
    return {
      insertNoteBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "paragraph",
              },
            ],
          });
        },
    };
  },
});
```

## Key Decisions

1. **Block-level node:** `group: "block"` makes it a top-level element
2. **Flexible content:** `content: "block+"` allows paragraphs, lists, headings inside
3. **No nesting:** `defining: true` prevents notes inside notes
4. **HTML serialization:** Uses `data-type="note-block"` for parsing/rendering
5. **Command:** `insertNoteBlock()` command for programmatic insertion

## Acceptance Criteria

- [ ] File created at `packages/editor/src/extensions/NoteBlock.ts`
- [ ] Extension follows Tiptap patterns (see Blank.ts and Exercise.ts as examples)
- [ ] No TypeScript errors
- [ ] No use of `as any` type assertions
- [ ] `defining: true` prevents nesting
- [ ] Command `insertNoteBlock()` is defined
- [ ] ReactNodeViewRenderer references NoteBlockView (to be created in next task)

## References

See existing extensions for patterns:
- `packages/editor/src/extensions/Blank.ts` - Inline node example
- `packages/editor/src/extensions/Exercise.ts` - Block node with content example

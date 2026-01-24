---
status: done
priority: high
description: Add toXML() and fromXML() functions to the editor package for AI document exchange
tags: [editor, ai]
---

# Implement Document XML Serialization

Add `toXML()` and `fromXML()` functions to `packages/editor` that convert between Tiptap's JSON format and a custom XML format suitable for LLM consumption.

## Why XML?

- More token-efficient than JSON for LLMs
- Natural representation of document structure
- Easy for AI to read and generate
- Well-defined schema for validation

## XML Format Specification

### Root Element

```xml
<lesson>
  <!-- Block-level content -->
</lesson>
```

### Block Elements

| Element         | Tiptap Node    | Attributes              |
| --------------- | -------------- | ----------------------- |
| `<h1>` - `<h3>` | heading        | level (implicit in tag) |
| `<p>`           | paragraph      | -                       |
| `<ul>`          | bulletList     | -                       |
| `<ol>`          | orderedList    | start?                  |
| `<li>`          | listItem       | -                       |
| `<blockquote>`  | blockquote     | -                       |
| `<hr />`        | horizontalRule | -                       |
| `<br />`        | hardBreak      | -                       |

### Custom Building Blocks

#### Exercise

```xml
<exercise id="ex-abc123">
  <p>Content here...</p>
</exercise>
```

- `id` - Optional on input (auto-generated), included on output
- Note: `index` is auto-calculated by Tiptap, not serialized

#### Blank (Inline Atomic)

```xml
<blank answer="goes" alts="is going,was going" hint="present tense" student-answer="" />
```

- `answer` (required) - Correct answer
- `alts` (optional) - Comma-separated alternative correct answers
- `hint` (optional) - Hint text for students
- `student-answer` - Current student input (included in output)

#### NoteBlock

```xml
<note>
  <p>Teacher note content...</p>
</note>
```

No attributes. Contains block content.

#### WritingArea

```xml
<writing-area id="wa-1" lines="5" placeholder="Write here...">
  <p>Student content</p>
</writing-area>
```

- `id` - Optional identifier
- `lines` - Visual line count (default: 5)
- `placeholder` - Placeholder text

#### Group

```xml
<group id="group-abc123">
  <p>Grouped content</p>
</group>
```

- `id` - Optional on input (auto-generated)

### Inline Marks

| Tag      | Mark          |
| -------- | ------------- |
| `<b>`    | bold          |
| `<i>`    | italic        |
| `<u>`    | underline     |
| `<s>`    | strikethrough |
| `<code>` | inline code   |

Marks can nest: `<b><i>bold and italic</i></b>`

### Complete Example

```xml
<lesson>
  <h1>Past Tense Verbs</h1>

  <p>In this lesson, we'll practice using past tense verbs correctly.</p>

  <note>
    <p>Students often confuse regular and irregular past tense forms.</p>
  </note>

  <exercise id="ex-abc123">
    <h3>Exercise 1: Fill in the Blanks</h3>
    <p>Complete each sentence with the correct past tense form.</p>
    <ol>
      <li>She <blank answer="went" alts="had gone" hint="irregular verb" student-answer="" /> to the store.</li>
      <li>They <blank answer="played" hint="regular verb" student-answer="plaied" /> soccer.</li>
    </ol>
  </exercise>

  <exercise id="ex-def456">
    <h3>Exercise 2: Short Answer</h3>
    <p>Write about your weekend.</p>
    <writing-area id="wa-1" lines="8" placeholder="Describe your weekend...">
      <p></p>
    </writing-area>
  </exercise>

  <hr />

  <p><b>Remember:</b> Irregular verbs don't follow the <i>-ed</i> pattern!</p>
</lesson>
```

### Excluded Elements

- **ExerciseGeneration** - Transient UI state
- **Tables** - Deferred for MVP
- **Images** - Deferred for MVP
- **CodeBlock** - Not enabled in editor

## Implementation

### Location

`packages/editor/src/serialization/`

### File Structure

```
packages/editor/src/
├── serialization/
│   ├── index.ts              # Re-exports public API
│   ├── to-xml.ts             # toXML() function
│   ├── to-xml.test.ts
│   ├── from-xml.ts           # fromXML() function
│   ├── from-xml.test.ts
│   ├── validate-xml.ts       # validateXML() function
│   ├── validate-xml.test.ts
│   ├── types.ts              # Shared types
│   └── node-handlers/        # Per-node logic
│       ├── blocks.ts         # Standard nodes
│       ├── blocks.test.ts
│       ├── exercise.ts       # exercise + blank
│       ├── exercise.test.ts
│       ├── note.ts
│       ├── note.test.ts
│       ├── writing-area.ts
│       ├── writing-area.test.ts
│       ├── group.ts
│       └── group.test.ts
```

### Public API

```typescript
import type { Editor } from "@tiptap/core";

export interface ToXMLOptions {
  pretty?: boolean; // Add indentation (default: true)
}

export interface FromXMLOptions {
  replace?: boolean; // Replace entire doc (default: true)
}

// Convert editor content to XML
export function toXML(editor: Editor, options?: ToXMLOptions): string;

// Parse XML and apply to editor
export function fromXML(
  editor: Editor,
  xml: string,
  options?: FromXMLOptions,
): void;

// Validate XML without applying
export function validateXML(xml: string): {
  valid: boolean;
  error?: string;
};
```

### ID Handling

- **Output (toXML)**: Include IDs for AI to reference elements
- **Input (fromXML)**: Missing IDs auto-generated by Tiptap's UniqueID extension
- Existing IDs preserved through round-trip

### Error Handling (Strict)

Invalid XML is rejected entirely:

- Unknown tags → Error
- Malformed XML → Error
- Invalid attributes → Error

## Testing Strategy

### Setup

Add vitest to `packages/editor`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^3.0.5"
  }
}
```

### Test Categories

1. **Serialization** - Each node type → correct XML
2. **Parsing** - XML → correct Tiptap JSON
3. **Round-trip** - `fromXML(toXML(doc))` preserves structure
4. **Validation** - Invalid XML rejected with clear errors
5. **Edge cases** - Empty docs, special characters, deep nesting

## Acceptance Criteria

- [ ] `toXML()` serializes all supported node types
- [ ] `fromXML()` parses XML and updates editor content
- [ ] `validateXML()` checks structure before applying
- [ ] Round-trip preserves document structure
- [ ] IDs handled correctly (preserve existing, auto-generate new)
- [ ] Student answers included in serialization
- [ ] Exported from `packages/editor` main entry point
- [ ] Unit tests with colocated test files
- [ ] Vitest configured in packages/editor

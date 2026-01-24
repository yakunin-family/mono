---
status: todo
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

## Implementation

### Location

`packages/editor/src/serialization/xml.ts`

### Functions

```typescript
// Convert Tiptap editor content to XML string
export function toXML(editor: Editor): string;

// Parse XML string and apply to Tiptap editor
export function fromXML(editor: Editor, xml: string): void;

// Validate XML without applying (for error checking)
export function validateXML(xml: string): { valid: boolean; error?: string };
```

### XML Format Example

```xml
<document>
  <heading level="1">Lesson Title</heading>
  <paragraph>Introduction text here.</paragraph>
  <exercise type="fill-blanks" id="ex-1">
    <instruction>Fill in the blanks with the correct verb form.</instruction>
    <content>
      <paragraph>She <blank id="b1" answer="goes"/> to school every day.</paragraph>
    </content>
  </exercise>
</document>
```

## Acceptance Criteria

- [ ] `toXML()` converts all supported node types to XML
- [ ] `fromXML()` parses XML and updates editor content
- [ ] `validateXML()` checks structure before applying
- [ ] Round-trip preserves document structure (toXML -> fromXML -> toXML matches)
- [ ] Handles all existing Tiptap extensions (headings, paragraphs, exercises, blanks, etc.)
- [ ] Exported from `packages/editor` main entry point
- [ ] Unit tests for serialization/deserialization

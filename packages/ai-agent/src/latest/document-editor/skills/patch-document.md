Apply surgical edits to the document using semantic operations. Preferred over editDocument for targeted changes.

OPERATIONS:

- insert_after: Insert a new block after the node with the given ID
- insert_before: Insert a new block before the node with the given ID
- replace_block: Replace an entire block with a new one
- delete_block: Delete the block with the given ID
- set_content: Replace the inline content within a paragraph or heading
- set_attrs: Update attributes of a node (e.g., blank answers, writingArea lines)
- wrap: Wrap multiple blocks in a container (exercise, group, or blockquote)
- unwrap: Remove a wrapper, lifting its content out

BLOCK TYPES: paragraph, heading, bulletList, orderedList, blockquote, horizontalRule, exercise, group, noteBlock, writingArea

INLINE CONTENT: text (with optional marks: bold, italic, underline, strike, code), blank, hardBreak

IMPORTANT: Lists use "items" (not "content"). Each item has a "content" array of blocks.

=== EXAMPLES FOR EACH OPERATION ===

EXAMPLE - insert_after (add exercise with fill-in-the-blank):

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "p-abc123",
      "block": {
        "type": "exercise",
        "content": [
          {
            "type": "paragraph",
            "content": [
              { "type": "text", "text": "The capital of France is " },
              { "type": "blank", "correctAnswer": "Paris" },
              { "type": "text", "text": "." }
            ]
          }
        ]
      }
    }
  ],
  "summary": "Added fill-in-the-blank exercise about France"
}
```

EXAMPLE - insert_before (add instructions before exercise):

```json
{
  "operations": [
    {
      "op": "insert_before",
      "id": "exercise-xyz",
      "block": {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Complete the following exercise:" }
        ]
      }
    }
  ],
  "summary": "Added instructions before exercise"
}
```

EXAMPLE - replace_block (replace paragraph with heading):

```json
{
  "operations": [
    {
      "op": "replace_block",
      "id": "p-old123",
      "block": {
        "type": "heading",
        "level": 2,
        "content": [{ "type": "text", "text": "New Section Title" }]
      }
    }
  ],
  "summary": "Replaced paragraph with heading"
}
```

EXAMPLE - delete_block (remove a paragraph):

```json
{
  "operations": [
    {
      "op": "delete_block",
      "id": "p-remove456"
    }
  ],
  "summary": "Removed paragraph"
}
```

EXAMPLE - set_content (change text in existing paragraph):

```json
{
  "operations": [
    {
      "op": "set_content",
      "id": "p-def456",
      "content": [
        { "type": "text", "text": "This is the new text with " },
        { "type": "text", "text": "bold words", "marks": ["bold"] },
        { "type": "text", "text": "." }
      ]
    }
  ],
  "summary": "Updated paragraph text with bold formatting"
}
```

EXAMPLE - set_attrs (update blank answer):

```json
{
  "operations": [
    {
      "op": "set_attrs",
      "id": "blank-ghi789",
      "attrs": { "correctAnswer": "London", "hint": "Capital of UK" }
    }
  ],
  "summary": "Changed blank answer to London"
}
```

EXAMPLE - wrap (wrap paragraphs in exercise):

```json
{
  "operations": [
    {
      "op": "wrap",
      "ids": ["p-abc", "p-def"],
      "wrapper": "exercise"
    }
  ],
  "summary": "Wrapped paragraphs in exercise"
}
```

EXAMPLE - unwrap (remove exercise wrapper, keep content):

```json
{
  "operations": [
    {
      "op": "unwrap",
      "id": "exercise-123"
    }
  ],
  "summary": "Removed exercise wrapper, keeping content"
}
```

EXAMPLE - bulletList (IMPORTANT: use "items", not "content"):

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "p-intro",
      "block": {
        "type": "bulletList",
        "items": [
          {
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "First item" }]
              }
            ]
          },
          {
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Second item" }]
              }
            ]
          }
        ]
      }
    }
  ],
  "summary": "Added bullet list"
}
```

EXAMPLE - orderedList (IMPORTANT: use "items", not "content"):

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "p-intro",
      "block": {
        "type": "orderedList",
        "items": [
          {
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Step one" }]
              }
            ]
          },
          {
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Step two" }]
              }
            ]
          },
          {
            "content": [
              {
                "type": "paragraph",
                "content": [{ "type": "text", "text": "Step three" }]
              }
            ]
          }
        ]
      }
    }
  ],
  "summary": "Added numbered steps"
}
```

EXAMPLE - writingArea (student response area):

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "p-prompt",
      "block": {
        "type": "writingArea",
        "lines": 5,
        "placeholder": "Write your answer here..."
      }
    }
  ],
  "summary": "Added writing area for student response"
}
```

EXAMPLE - blockquote:

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "p-intro",
      "block": {
        "type": "blockquote",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "To be or not to be, that is the question."
              }
            ]
          }
        ]
      }
    }
  ],
  "summary": "Added Shakespeare quote"
}
```

EXAMPLE - horizontalRule:

```json
{
  "operations": [
    {
      "op": "insert_after",
      "id": "exercise-1",
      "block": {
        "type": "horizontalRule"
      }
    }
  ],
  "summary": "Added divider between sections"
}
```

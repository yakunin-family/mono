---
description: Design for a chat-based AI assistant that can edit the current document
tags: [ai, editor, features]
---

# In-Document AI Chat

## Vision

A chat sidebar in the document editor where teachers can instruct an AI to edit the document. Instead of predefined buttons or forms, teachers describe what they want in natural language, and the AI makes the changes directly.

**Why chat over forms:**
- Users discover their own use cases organically
- Not limited by our ability to predict future needs
- Scales to any document operation without new UI

## User Experience

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├──────────┬─────────────────────────────┬───────────────────┤
│          │                             │                   │
│   Nav    │      Document Editor        │   Chat Sidebar    │
│  Sidebar │        (Tiptap)             │   (collapsible)   │
│          │                             │                   │
│          │                             │                   │
└──────────┴─────────────────────────────┴───────────────────┘
```

- Left: Navigation sidebar (existing)
- Center: Document editor (existing)
- Right: Chat sidebar (new, collapsible)

### Interaction Flow

1. Teacher opens chat sidebar
2. Teacher types instruction: "Add three fill-in-the-blank exercises about past tense"
3. AI responds in chat, explaining what it will do
4. AI edits appear directly in the document
5. Teacher reviews and continues editing normally

### Example Prompts

- "Convert this paragraph into a multiple choice question"
- "Add blanks to all the verbs in the selected text"
- "Create a reading comprehension section with 5 questions"
- "Simplify this text for A2 level students"
- "Turn my notes into a structured lesson"

## Phased Rollout

### Phase 1: Document Editing (MVP)

AI can read and edit the current document based on chat instructions.

**Capabilities:**
- Read current document content
- Insert new content (paragraphs, exercises, headings, etc.)
- Delete content
- Replace/modify existing content
- Transform content (e.g., paragraph → exercise)

**Not included:**
- File uploads
- Library access
- Multi-document operations

### Phase 2: File Upload

Teachers can upload files as context for AI operations.

**Capabilities:**
- Upload images (worksheets, textbook pages)
- Upload PDFs
- Upload text files
- AI uses uploaded content to inform edits

**Example:** "Here's a photo of my worksheet. Convert it into interactive exercises."

### Phase 3: Library Integration

AI can search and use content from the teacher's library.

**Capabilities:**
- Search library by semantic meaning
- Insert library items into document
- Suggest relevant library content

**Example:** "Find exercises about irregular verbs from my library and add them here."

## Technical Architecture

The client applies AI-generated changes to the local Tiptap editor, and Yjs syncs automatically via Hocuspocus. The backend handles conversation storage and LLM calls but doesn't touch the document directly.

```
1. User sends message
        │
        ▼
2. Client → Convex: { message, documentContext }
        │
        ▼
3. Convex calls LLM, returns structured response
        │
        ▼
4. Client applies changes to Tiptap editor
        │
        ▼
5. Yjs syncs to other clients via Hocuspocus
```

## Design Decisions

### Document Format: XML

The AI reads and writes documents in a custom XML format. This format is used for both input (current document state) and output (AI's edits).

**Why XML:**
- LLMs are heavily trained on XML — Claude handles it naturally
- Clear open/close semantics make nesting unambiguous
- Attributes for metadata (IDs, answers, config) fit naturally
- Inline elements work well (`<blank/>` inside text)
- Easy to reference specific parts ("the blank with id b-1")

**Example:**

```xml
<document>
  <heading level="1">Lesson: Past Tense Verbs</heading>

  <exercise id="ex-1">
    <paragraph>
      The verb <blank id="b-1" answer="runs"/> is irregular.
    </paragraph>
    <paragraph>
      She <blank id="b-2" answer="went"/> to the store.
    </paragraph>
  </exercise>

  <writing-area id="wa-1" placeholder="Write your answer here"/>
</document>
```

**What the format includes:**
- Body content only (exercises, paragraphs, building blocks)
- Metadata (title, created date, author) is handled separately

**What the AI's system prompt includes:**
- Purpose and behavior of each building block type
- The AI infers relationships between elements from their position in the document

### Edit Approach: Full Document Replacement (MVP)

For the MVP, the AI returns the complete document XML after edits. The client replaces the entire editor content.

**Why full replacement:**
- Simplest to build and debug
- No ambiguity about the final state
- Targeted operations (editing specific elements by ID) can be added later as an optimization

### Serialization: In Editor Package

The `packages/editor` package owns the XML format since it owns the node types:
- `toXML()` — serialize Tiptap document to XML
- `fromXML()` — parse XML back to Tiptap JSON

When a new building block is added, its serialization is added in the same place.

### Error Handling: Strict (MVP)

If the AI returns invalid XML or unknown tags, the entire response is rejected. The user sees an error and can retry.

**Why strict:**
- Clear failure modes for debugging
- No weird half-applied states
- Easier to improve the system prompt when things go wrong
- Lenient parsing can be added later if needed

### Streaming: None (MVP)

No streaming for the MVP. The client shows a loading state while waiting for the complete response, then applies the document update.

**Why no streaming:**
- Simplest implementation
- Streaming chat text or document edits can be added later

### Data Flow

```
User sends message
       │
       ▼
Client serializes Tiptap → XML (toXML)
       │
       ▼
Client → Convex: { message, documentXML }
       │
       ▼
Convex calls LLM with XML + conversation history
       │
       ▼
LLM returns new document XML
       │
       ▼
Convex returns XML to client
       │
       ▼
Client parses XML → Tiptap JSON (fromXML)
       │
       ▼
Client replaces editor content
       │
       ▼
Yjs syncs to other clients via Hocuspocus
```

## Future Enhancements

These are intentionally deferred from the MVP:

- **Targeted operations** — Edit specific elements by ID instead of full replacement
- **Streaming** — Stream chat responses, then apply edits at the end
- **Lenient parsing** — Recover from minor AI mistakes instead of rejecting

## Out of Scope

- **Full app control**: No space management, homework assignment, or progress tracking (see [i-7] for future vision)
- **Automatic triggers**: No hijacking paste or auto-detecting content to convert
- **Multi-document**: AI works on current document only
- **Student app**: Teacher app only for now

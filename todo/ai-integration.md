Implementation Plan
Phase 1: Minimal Viable Generator (1-2 days)
Goal: Generate ONE exercise type with hardcoded settings

Pick the simplest exercise type: multiple-choice (no nesting, clear structure)
Hardcode everything: Level B1, English native, topic provided by user
Get it working end-to-end: User input → LLM → Valid exercise JSON → Display

Deliverable: Can generate 3-5 multiple choice questions on any topic

Phase 2: Add Structure (1-2 days)
Goal: Clean architecture for adding more types

Set up prompt loading system (the markdown + interpolation approach)
Create exercise type registry with schemas
Add 2-3 more standalone types: true-false, fill-blanks, short-answer

Deliverable: Can generate 4 different exercise types, code is organized

Phase 3: Add Nesting (2-3 days)
Goal: Parent-child exercise relationships

Add one content provider: text-passage
Wire up nesting: text-passage can have MC/TF/short-answer children
Ensure children reference parent content

Deliverable: Can generate "read this text, then answer questions about it"

Phase 4: Add Clarifier (1-2 days)
Goal: Smart requirement gathering

Build the clarifier prompt
Implement the multi-step flow
Handle missing/ambiguous requirements

Deliverable: System asks for missing info before generating

Phase 5: Expand & Polish (ongoing)

Add remaining exercise types
Add more content providers (audio, video, image)
Add source material support
Tutor customization options

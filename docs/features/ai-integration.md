# AI Integration Feature: Disconnect-Proof Streaming Content Generation

**Status**: Planning
**Created**: 2025-11-15
**Priority**: High

## Overview

Integrate Vercel AI Gateway into the collaborative document editor to enable AI-powered content generation with real-time streaming, disconnect-proof persistence, and usage tracking.

## Goals

1. **Content Generation**: Allow users to generate content via AI prompts directly in the editor
2. **Disconnect-Proof**: Content appears in document even if user loses connection or closes browser
3. **Streaming UX**: Show AI responses in real-time as they're generated
4. **Usage Tracking**: Track which teachers use AI and token consumption for billing
5. **Document Awareness**: AI understands document structure (headings, exercises)
6. **Exercise Generation**: AI can generate structured exercise blocks via JSON format

## Non-Goals (for now)

- Assignment checking and feedback (future phase)
- Screenshot parsing for exercise extraction (future phase)
- Enforcing usage limits (track only, don't block)

---

## Architecture Overview

### Core Pattern

Uses **Convex's Persistent Text Streaming** pattern for disconnect-proof by design:

```
User types prompt in AI block
       ↓
Frontend creates aiGeneration record (with streamId)
       ↓
Frontend triggers Convex action (server-side)
       ↓
Backend streams from Vercel AI Gateway
       ↓
Backend updates database on sentence boundaries
       ↓
All clients subscribe via useQuery (reactive updates)
       ↓
Generation completes → show in AIGeneration node
       ↓
IF auto-accept enabled: immediately insert content
       ↓
IF auto-accept disabled: show Accept/Regenerate buttons
       ↓
User accepts (or auto-insert) → content inserted into editor
       ↓
Yjs syncs to all collaborators
```

### Key Principles

- **Server-side streaming**: Backend streams from AI Gateway independently of client connections
- **Database as source of truth**: Content progressively saved, clients subscribe reactively
- **User control**: Manual accept (default) or auto-accept toggle (power-user mode)
- **Multiplayer native**: Any connected user can accept generated content, not just requester

### Components

1. **Frontend (Editor Package)**
   - New Tiptap node: `AIGeneration`
   - UI for prompt input, model selection, streaming display
   - Convex useQuery subscription for real-time updates
   - Auto-accept toggle (stored in localStorage)

2. **Backend (Convex)**
   - Persistent Text Streaming component integration
   - AI action streams from Vercel AI Gateway
   - Progressive database updates during streaming
   - Usage tracking and quota warnings

3. **Collaboration Server (Hocuspocus)**
   - No changes needed
   - Syncs editor content as usual

---

## Technical Requirements

### Backend Infrastructure

#### Dependencies
- `ai` - Vercel AI SDK for calling AI Gateway
- `@convex-dev/persistent-text-streaming` - Convex component for disconnect-proof streaming

Install in `apps/backend`:
```bash
pnpm add ai @convex-dev/persistent-text-streaming
```

Configure Convex component in `apps/backend/convex.config.ts`:
- Import and use `persistentTextStreaming` component

#### Environment Variables
Add to `apps/backend/.env.local`:
- `AI_GATEWAY_API_KEY` - Get from Vercel Dashboard → AI Gateway → API Keys

#### Database Schema

**New table: `aiGeneration`**
```typescript
{
  documentId: Id<"document">,
  userId: string,                      // Better Auth user ID (who requested)
  promptText: string,                   // User's prompt
  streamId: string,                     // From persistent-text-streaming component
  generatedContent: string,             // AI response (updated progressively)
  model: string,                        // e.g., "openai/gpt-4"
  tokensUsed?: number,                  // Token count for billing
  status: "pending" | "streaming" | "completed" | "failed",
  errorMessage?: string,
  acceptedBy?: string,                  // User ID who accepted (prevents duplicates)
  acceptedAt?: number,                  // When accepted
  createdAt: number,
}
```

Indexes:
- `by_document` on `documentId`
- `by_user_date` on `userId`, `createdAt`
- `by_streamId` on `streamId`

**Update `teacher` table:**
```typescript
{
  aiTokensUsed?: number,      // Total tokens consumed
  aiQuotaLimit?: number,      // Monthly quota (not enforced yet)
}
```

#### Backend Functions

**Mutation: `createGeneration`**
- Args: `documentId`, `promptText`, `model`
- Verifies user has document access
- Checks usage quota (warn but don't block)
- Creates stream using persistent-text-streaming component
- Creates aiGeneration tracking record
- Returns `generationId` and `streamId`

**Action: `streamGeneration`**
- Args: `generationId`
- Fetches generation record
- Updates status to "streaming"
- Calls Vercel AI SDK `streamText()`
- Streams from AI Gateway (server-side)
- Updates database on sentence boundaries (for performance)
- On completion: saves final content, token count
- Updates teacher's `aiTokensUsed`
- On error: marks as failed with error message

**Mutation: `markGenerationAccepted`**
- Args: `generationId`, `acceptedBy`
- Sets `acceptedBy` and `acceptedAt` fields
- Prevents duplicate accepts via database lock

---

### Editor Integration

#### AIGeneration Tiptap Node

**File**: `packages/editor/src/extensions/AIGeneration.ts`

Requirements:
- Block-level node (group: "block")
- Attributes: `generationId`, `prompt`, `model`, `status`
- Uses ReactNodeViewRenderer for custom UI
- Similar pattern to existing `Exercise.ts` node

#### AIGeneration UI Component

**File**: `packages/editor/src/components/AIGenerationView.tsx`

**State 1: Input**
```
┌─────────────────────────────────────────┐
│ ✨ AI Content Generation                │
├─────────────────────────────────────────┤
│ What would you like to create?          │
│ ┌─────────────────────────────────────┐ │
│ │ [textarea]                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Model: [openai/gpt-4 ▾]                 │
│                                         │
│              [Generate →]               │
└─────────────────────────────────────────┘
```

**State 2: Streaming**
```
┌─────────────────────────────────────────┐
│ ✨ AI Content Generation                │
│                                         │
│ [🔄 Auto-Accept: OFF ▾]  Model: GPT-4   │
├─────────────────────────────────────────┤
│ The quick brown fox jumps over the      │
│ lazy dog. Mathematics is the study▊     │
└─────────────────────────────────────────┘
```

**State 3: Completed (Manual Accept)**
```
┌─────────────────────────────────────────┐
│ ✨ Generation Complete                  │
│                                         │
│ [🔄 Auto-Accept: OFF ▾]                  │
├─────────────────────────────────────────┤
│ [Generated content preview...]          │
│                                         │
│         [Accept ✓]  [Regenerate ↻]      │
└─────────────────────────────────────────┘
```

**State 4: Auto-Accept Enabled**
```
┌─────────────────────────────────────────┐
│ ✨ AI Content Generation                │
│                                         │
│ [⚡ Auto-Accept: ON ▾]  Model: GPT-4    │
├─────────────────────────────────────────┤
│ The quick brown fox jumps over the      │
│ lazy dog. Mathematics is the study▊     │
└─────────────────────────────────────────┘

(On completion: immediately inserts content and removes node)
```

**Component Behavior:**
- Subscribe to aiGeneration record via `useQuery(api.ai.getGeneration, { id })`
- Auto-accept toggle stored in localStorage: `doc-${documentId}-ai-auto-accept`
- On generation complete:
  - If auto-accept ON and not already accepted: immediately insert and remove node
  - If auto-accept OFF: show Accept/Regenerate buttons
- On Accept: call `markGenerationAccepted` mutation, insert content, remove node
- On Regenerate: create new generation with same prompt

**Model Options:**
- `openai/gpt-4o` - Fast, balanced
- `openai/gpt-4` - Higher quality
- `anthropic/claude-3-5-sonnet` - Best for education
- `anthropic/claude-3-opus` - Most capable

#### SlashCommand Integration

**File**: `packages/editor/src/extensions/SlashCommand.tsx`

Add item:
- Title: "AI Generation"
- Description: "Generate content with AI"
- Icon: ✨
- Command: Insert `aiGeneration` node

---

### Accept/Reject Flow

#### Scenario 1: Manual Accept (Default)
1. User triggers AI generation
2. Server streams, updates database
3. All clients see streaming via useQuery
4. Generation completes
5. AIGeneration node shows [Accept] [Regenerate] buttons
6. User (any viewer) clicks Accept
7. Mark acceptedBy in database (prevents duplicates)
8. Insert content into editor, remove node
9. Yjs syncs to all clients

#### Scenario 2: Auto-Accept Enabled
1. User enables auto-accept toggle
2. Triggers AI generation
3. Server streams, updates database
4. All clients see streaming content
5. Generation completes
6. Auto-insert immediately (no manual step)

#### Scenario 3: Disconnect During Generation
1. User triggers generation
2. Server streaming, database updating
3. User disconnects (browser closed)
4. Server continues streaming to completion
5. Generation stored in database
6. User reconnects later (or another user views)
7. AIGeneration node still exists with generationId
8. Shows Accept/Regenerate buttons (or auto-inserts if enabled)
9. Any user can accept

#### Scenario 4: Multiple Clients
1. User A triggers generation
2. User B viewing same document
3. Both see streaming in real-time
4. Generation completes
5. User A clicks Accept first
6. acceptedBy field set in database
7. User B's Accept button disabled (already accepted)
8. Content inserted, Yjs syncs to both

#### Scenario 5: Mid-Stream Toggle
1. User watching AI stream
2. Likes what they see
3. Clicks toggle: Auto-Accept ON
4. Generation completes
5. Immediately auto-inserts

#### Edge Cases

**Multiple browser tabs:**
- All tabs subscribe to same record
- First to accept wins (database lock)
- Others see acceptedBy set, disable button

**Network instability:**
- Convex WebSocket auto-reconnects
- Missed updates fetched on reconnect
- No data loss

**Browser refresh mid-stream:**
- Component remounts
- useQuery fetches current state
- Streaming continues server-side
- Auto-accept preference restored from localStorage

**Requester never returns:**
- Content in database
- Other collaborators can accept
- No content lost

---

### Document Structure Awareness

#### Context Extraction

Before AI generation, extract from document:
- Document outline (headings)
- Exercise count
- Surrounding context (200 chars before/after cursor)
- Existing exercises

Send to AI as system prompt context.

#### Exercise JSON Format

When AI generates exercises, return structured JSON:
```json
{
  "type": "exercise",
  "content": "Question text here...",
  "solution": "Optional solution",
  "metadata": { "difficulty": "medium" }
}
```

#### Content Insertion Logic

`parseAndInsertContent` function:
1. Try to find JSON blocks in AI response
2. Parse and validate structure
3. If valid exercise JSON: insert Exercise node
4. Else: insert as regular content (markdown or plain text)
5. Handle parsing errors gracefully (show as plain text)

---

### Usage Tracking

#### Token Tracking
- After generation completes, extract token count from AI SDK response
- Update `aiGeneration.tokensUsed`
- Increment `teacher.aiTokensUsed`

#### Quota Checking (Non-Enforced)
- Before generation, check: `currentUsage > quota * 0.8`
- Log warning if approaching limit
- Log violation if exceeded
- Allow request to proceed (don't block yet)

#### Usage Queries

**For teacher dashboard:**
- `getMyAIUsage({ startDate?, endDate? })`
  - Returns: total tokens, tokens by model, tokens by day, recent generations

**For admin:**
- `getTeacherUsageStats({ teacherId })`
  - Returns: teacher's detailed usage stats

**For document history:**
- `getDocumentAIHistory({ documentId })`
  - Returns: all AI generations for document

---

## Implementation Plan

### Phase 1: Backend Setup [DONE]
- [ ] Install `ai` and `@convex-dev/persistent-text-streaming`
- [ ] Configure persistent-text-streaming component in convex.config.ts
- [ ] Add `AI_GATEWAY_API_KEY` environment variable
- [ ] Create `aiGeneration` schema table with indexes
- [ ] Update `teacher` table with usage fields
- [ ] Create `createGeneration` mutation
- [ ] Create `streamGeneration` action with basic streaming
- [ ] Test AI Gateway connection end-to-end

### Phase 2: Basic Editor Integration [DONE]
- [ ] Create `AIGeneration` Tiptap node extension
- [ ] Build `AIGenerationView` component (input state)
- [ ] Add `/ai` command to SlashCommand menu
- [ ] Implement generation trigger (calls mutation + action)
- [ ] Test: basic generation with client connected

### Phase 3: Real-Time Streaming [DONE]
- [ ] Implement `useQuery` subscription in AIGenerationView
- [ ] Add streaming state UI (progressive content display)
- [ ] Update database on sentence boundaries in action
- [ ] Test: see content stream in real-time
- [ ] Test: multiple clients see same stream

### Phase 4: Accept/Reject Flow [DONE]
- [ ] Add `acceptedBy` and `acceptedAt` fields to schema
- [ ] Create `markGenerationAccepted` mutation
- [ ] Implement Accept/Regenerate buttons UI
- [ ] Implement accept handler (mark + insert + remove node)
- [ ] Implement regenerate handler
- [ ] Test: manual accept flow
- [ ] Test: database lock prevents duplicate accepts

### Phase 5: Auto-Accept Toggle [SKIP]
- [ ] Add auto-accept toggle button to AIGenerationView
- [ ] Implement localStorage persistence
- [ ] Add auto-insert logic when autoAccept=true
- [ ] Test: toggle on, generation auto-inserts
- [ ] Test: toggle mid-stream, auto-inserts on completion
- [ ] Test: preference persists across page refreshes
- [ ] Polish: visual distinction when auto-accept enabled

### Phase 6: Disconnect-Proof Testing [DONE]
- [ ] Test: start generation, close browser mid-stream, reopen
- [ ] Test: start generation, lose network, reconnect
- [ ] Test: browser refresh during streaming
- [ ] Test: multiple tabs viewing same generation
- [ ] Test: requester disconnects, other user accepts
- [ ] Verify server-side streaming continues independently

### Phase 7: Content Insertion & Parsing [DONE]
- [x] Implement markdown parsing function (`parseMarkdownToNodes`)
- [x] Install and configure `@tiptap/markdown` extension
- [x] Handle markdown to Tiptap JSON conversion
- [x] Support headings (# ## ###), lists (bullet/ordered), inline formatting (bold, italic, strikethrough, code, links)
- [x] Update `handleAccept` to use markdown parser
- [x] Test: TypeScript compilation and builds pass
- [x] Test: AIGeneration node removed after insertion

**Implementation Details:**
- Installed `@tiptap/markdown` package (version compatible with Tiptap v3.10.7)
- Added Markdown extension to editor configuration in `DocumentEditorInternal.tsx`
- Created custom markdown parser in `AIGenerationView.tsx`:
  - `parseMarkdownToNodes(markdown: string)` - Converts markdown to Tiptap JSON structure
  - `parseInlineContent(text: string)` - Handles inline formatting (bold, italic, code, links, strikethrough)
- Supported markdown features:
  - Headings: `# H1`, `## H2`, `### H3`
  - Bullet lists: `- item` or `* item`
  - Ordered lists: `1. item`, `2. item`
  - Bold: `**text**` or `__text__`
  - Italic: `*text*` or `_text_`
  - Strikethrough: `~~text~~`
  - Inline code: `` `code` ``
  - Links: `[text](url)`
  - Paragraphs: Double newline separation
- Content insertion strategy: Delete AIGeneration node first, then insert parsed markdown nodes at same position

### Phase 8: Document Context & Exercise Generation
- [ ] Implement context extraction (headings, exercises, surrounding text)
- [ ] Pass context to AI in system prompt
- [ ] Define exercise JSON schema
- [ ] Implement JSON parsing for exercises
- [ ] Auto-insert Exercise nodes from JSON
- [ ] Handle parsing errors gracefully

### Phase 9: Usage Tracking
- [ ] Track tokens in `completeGeneration` mutation
- [ ] Update teacher's `aiTokensUsed` field
- [ ] Implement usage queries (getMyAIUsage, etc.)
- [ ] Add quota checking (non-enforced warnings)
- [ ] Create teacher dashboard UI for usage stats

### Phase 10: Polish & Error Handling
- [ ] Error state UI in AIGenerationView
- [ ] Retry button for failed generations
- [ ] Loading states and animations
- [ ] Model selector dropdown polish
- [ ] Toast notifications for errors/warnings
- [ ] Admin dashboard for usage monitoring
- [ ] Optional: Add global auto-accept preference in settings

---

## Success Criteria

### MVP Requirements
- [ ] Teachers can generate content via AI in editor
- [ ] Streaming works smoothly (< 100ms latency)
- [ ] Content persists even if client disconnects
- [ ] Usage tracked accurately in database
- [ ] Exercise generation works via JSON parsing
- [ ] No data loss or corruption in collaborative editing

### Performance Targets
- AI response time: < 3 seconds for first token
- Streaming latency: < 100ms per chunk
- Database update time: < 500ms backend processing
- No Yjs conflicts or lost updates

---

## Open Questions

1. **Content insertion position**: Insert at AIGeneration node position, then remove node?
2. **Multiple AIGeneration nodes**: Allow multiple parallel generations per document?
3. **Cancellation**: Add "Cancel" button that marks as cancelled, hides from UI?
4. **Rate limiting**: Implement both client-side (disable button) and server-side (per teacher limits)?
5. **Model selection persistence**: Store last selected model in localStorage?
6. **Streaming granularity**: Stick with sentence boundaries for MVP?
7. **Error recovery**: Show partial content + retry button on failure?

---

## Resources

### Documentation
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Convex Persistent Text Streaming Component](https://www.convex.dev/components/persistent-text-streaming)
- [Convex Stack: GPT Streaming with Persistent Reactivity](https://stack.convex.dev/gpt-streaming-with-persistent-reactivity)
- [Tiptap Docs](https://tiptap.dev)

### Code References (This Codebase)
- Existing Exercise node: `packages/editor/src/extensions/Exercise.ts`
- SlashCommand: `packages/editor/src/extensions/SlashCommand.tsx`
- Document mutations: `apps/backend/convex/documents.ts`
- Convex schema: `apps/backend/convex/schema.ts`

### External Examples
- [T3 Chat (uses this pattern)](https://t3.chat)
- [Theo's video on Convex migration](https://www.youtube.com/watch?v=xFVh9beupwo&t=2221s)
- [Convex Persistent Streaming GitHub](https://github.com/get-convex/persistent-text-streaming)

---

## Notes

### Architecture Decision
- **Pattern**: Convex Persistent Text Streaming (server-side streaming + database persistence)
- **Insertion**: Accept/Reject flow with Auto-Accept toggle (inspired by Claude Code)
- **Why**: Best UX-to-cost ratio - low complexity, high flexibility, safe default with power-user option

### Key Learnings from T3 Chat
- Server-side streaming with database persistence works excellently
- Convex reactivity (~24ms latency) feels real-time
- Pattern scales to high traffic (thousands of simultaneous users)

### Critical Success Factors
- Usage tracking crucial for future business model
- Exercise JSON format must be well-defined and validated
- Error handling critical - AI calls can fail for many reasons
- Auto-accept toggle provides flexibility without complexity

### Future Enhancements
- Global auto-accept preference (synced via Convex)
- Auto-accept per model (trust GPT-4 but not GPT-3.5)
- AI confidence scores (auto-accept if confidence > 90%)
- Multi-step workflows (chain multiple AI generations)
- Assignment checking and feedback
- Screenshot parsing for exercise extraction

---

**Last Updated**: 2025-11-16
**Next Review**: After Phase 8 completion

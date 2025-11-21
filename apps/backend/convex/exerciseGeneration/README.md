# Exercise Generation System

A multi-step AI-powered system for generating language learning exercises with validation, planning, and generation phases.

## Overview

The system follows a three-step workflow:

1. **Validation** - Analyzes user prompts and asks clarifying questions if needed
2. **Planning** - Creates a structured pedagogical plan for exercises
3. **Generation** - Generates actual exercise content based on the approved plan

## Architecture

### Database Schema

**`exerciseGenerationSession`** - Tracks the overall generation session
- `documentId`: Document where exercises will be inserted
- `userId`: User who initiated the generation
- `initialPrompt`: Original user request
- `model`: AI model to use (e.g., "openai/gpt-4o")
- `currentStep`: Current phase of generation
- `requirements`: Extracted/validated requirements
- `plan`: Generated exercise plan
- `tokensUsed`: Total tokens consumed
- `createdAt`, `updatedAt`: Timestamps

**`exerciseGenerationStep`** - Tracks individual step executions
- `sessionId`: Parent session
- `stepType`: "validation", "planning", or "generation"
- `status`: "pending", "processing", "completed", or "failed"
- `input`: JSON string of step input
- `output`: JSON string of step output
- `tokensUsed`: Tokens used for this step
- `createdAt`, `completedAt`: Timestamps

### State Management

Sessions progress through these states:
```
validating → awaiting_clarification ↔ validating
         ↓
    planning → awaiting_approval
         ↓
  generating → completed/failed
```

## API Reference

### Mutations

#### `startExerciseGeneration`
Initiates a new exercise generation session.

```typescript
const { sessionId } = await ctx.mutation(api.exerciseGeneration.startExerciseGeneration, {
  documentId: "doc_id",
  promptText: "Create A2 Spanish exercises about food",
  model: "openai/gpt-4o"
});
```

#### `answerClarifications`
Provides answers to clarification questions from validation step.

```typescript
await ctx.mutation(api.exerciseGeneration.answerClarifications, {
  sessionId: "session_id",
  answers: JSON.stringify({
    "level": "A2",
    "exerciseTypes": ["multiple-choice", "fill-blanks"]
  })
});
```

#### `approvePlan`
Approves the generated exercise plan and starts generation.

```typescript
await ctx.mutation(api.exerciseGeneration.approvePlan, {
  sessionId: "session_id"
});
```

### Queries

#### `getGenerationSession`
Retrieves the current state of a generation session with all step results.

```typescript
const { session, steps, validationResult, planResult, generationResult } =
  await ctx.query(api.exerciseGeneration.getGenerationSession, {
    sessionId: "session_id"
  });
```

Returns:
- `session`: Session record
- `steps`: All step records
- `validationResult`: Parsed validation output (if completed)
- `planResult`: Parsed planning output (if completed)
- `generationResult`: Parsed generation output (if completed)

## Zod Schemas

All AI responses are validated against Zod schemas for type safety.

### Validation Response
```typescript
{
  status: "ready" | "needs_clarification",
  extractedRequirements: {
    targetLanguage: string,
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    nativeLanguage?: string,
    topic?: string,
    duration?: number,
    exerciseTypes: string[],
    additionalContext?: string
  },
  clarificationNeeded?: ClarificationQuestion[],
  missingFields?: string[],
  reasoning?: string
}
```

### Planning Response
```typescript
{
  exercises: ExercisePlanItem[],
  totalDuration?: number,
  sequenceRationale?: string,
  learningObjectives?: string[]
}
```

### Generation Response
```typescript
{
  exercises: GeneratedExercise[],
  totalGenerated: number,
  errors?: Array<{ planItemId: string, error: string }>
}
```

## Exercise Types

The system supports 15+ exercise types across three categories:

### Material Providers (Input Phase)
- `text-passage` - Reading passages
- `audio-clip` - Listening material
- `video-content` - Video material
- `image-prompt` - Visual prompts

### Assessment Types (Comprehension Phase)
- `multiple-choice` - Multiple choice questions
- `true-false` - True/False statements
- `fill-blanks` - Fill in the blanks
- `sequencing` - Sequence/order events

### Production Types (Output Phase)
- `short-answer` - Short answer questions
- `summary-writing` - Write a summary
- `opinion-writing` - Opinion/response writing
- `discussion-prompt` - Discussion questions
- `description-writing` - Describe/write about
- `dictation` - Dictation exercises
- `role-play` - Role play scenarios
- `sentence-completion` - Complete sentences

## Prompt Templates

Prompts are defined in `exerciseGeneration/prompts.ts` and include:

### Validation Prompt
- Analyzes user requests
- Extracts requirements intelligently
- Generates clarification questions when needed
- Validates completeness of information

### Planning Prompt
- Creates pedagogically sound exercise sequences
- Follows Input → Comprehension → Production flow
- Estimates duration per exercise
- Defines learning objectives
- Specifies dependencies between exercises

### Generation Prompt
- Generates type-specific exercise content
- Adapts to CEFR level (A1-C2)
- Ensures cultural appropriateness
- Creates engaging, educational content

## Usage Example

### Frontend Integration

```typescript
// 1. Start generation
const { sessionId } = await startExerciseGeneration({
  documentId: currentDocId,
  promptText: userInput,
  model: "openai/gpt-4o"
});

// 2. Subscribe to session updates
const session = useQuery(api.exerciseGeneration.getGenerationSession, {
  sessionId
});

// 3. Handle clarifications if needed
if (session?.session.currentStep === "awaiting_clarification") {
  const answers = collectUserAnswers(session.validationResult.clarificationNeeded);
  await answerClarifications({ sessionId, answers: JSON.stringify(answers) });
}

// 4. Show plan for approval
if (session?.session.currentStep === "awaiting_approval") {
  showPlan(session.planResult);
  // On user approval:
  await approvePlan({ sessionId });
}

// 5. Process generated exercises
if (session?.session.currentStep === "completed") {
  const exercises = session.generationResult.exercises;
  insertExercisesIntoDocument(exercises);
}
```

## Error Handling

The system includes comprehensive error handling:

- Failed steps update the step status to "failed" with error message
- Sessions can fail and include an `errorMessage` field
- Partial generation continues if individual exercises fail
- Token usage is tracked even on failures

## Token Usage Tracking

Token consumption is tracked at multiple levels:
- Per-step token usage in `exerciseGenerationStep.tokensUsed`
- Total session tokens in `exerciseGenerationSession.tokensUsed`
- Teacher's cumulative usage updated in `teacher.aiTokensUsed`

## Configuration

### AI Model Selection

Supported models (via Vercel AI SDK):
- `"openai/gpt-4o"` - Recommended for quality
- `"openai/gpt-4o-mini"` - Faster, more economical
- `"anthropic/claude-3-5-sonnet-20241022"` - Alternative provider

### Environment Variables

Requires `AI_GATEWAY_API_KEY` in Convex environment for Vercel AI SDK.

## Development Notes

### Type Safety
All responses use Zod schemas for validation, ensuring type-safe data flow from AI to database to frontend.

### Structured Output
Uses `generateObject()` from Vercel AI SDK with Zod schemas rather than streaming, ensuring valid JSON responses.

### State Persistence
Database-backed state allows sessions to survive server restarts and enables audit trails.

### Extensibility
- Add new exercise types by extending Zod schemas
- Customize prompts by modifying template strings
- Add validation rules in Zod schemas

## Testing

To test the system:

1. Start a dev server: `pnpm dev`
2. Create a test document
3. Call `startExerciseGeneration` with a sample prompt
4. Monitor session state with `getGenerationSession`
5. Verify exercises are generated correctly

## Future Enhancements

Potential improvements:
- [ ] Add support for loading prompts from markdown files (requires Node.js runtime workaround)
- [ ] Implement prompt versioning and A/B testing
- [ ] Add exercise quality scoring
- [ ] Support for bulk exercise generation
- [ ] Exercise template system for consistency
- [ ] Integration with assessment/grading system

---
status: todo
priority: low
description: Add cost tracking for LLM usage and vector operations to monitor and optimize expenses
tags: [backend, monitoring, costs]
---

# Implement Cost Tracking and Monitoring

Add cost tracking for LLM usage and vector operations to monitor and optimize expenses.

## Implementation

### 1. Track Token Usage

Store token counts in messages:

```typescript
const aiChatMessage = defineTable({
  // ... existing fields
  tokensUsed: v.optional(v.number()),
  cost: v.optional(v.number()), // In USD cents
});
```

Extract from Vercel AI SDK response:

```typescript
const response = await streamText({...});
const tokensUsed = response.usage?.totalTokens;
await ctx.runMutation(internal.agent.storeMessage, {
  tokensUsed,
  cost: calculateCost(tokensUsed, model),
});
```

### 2. Cost Calculation

```typescript
function calculateCost(tokens: number, model: string): number {
  const prices = {
    "openai/gpt-4o": {
      input: 2.50 / 1_000_000,   // per token
      output: 10.00 / 1_000_000,
    },
    "openai/gpt-4o-mini": {
      input: 0.15 / 1_000_000,
      output: 0.60 / 1_000_000,
    },
  };
  // Calculate based on input/output split
  return tokens * prices[model].input; // Simplified
}
```

### 3. Usage Dashboard (Optional)

Create admin query to see usage:

```typescript
export const getUsageStats = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("aiChatMessage").collect();

    return {
      totalMessages: messages.length,
      totalTokens: sum(messages.map(m => m.tokensUsed ?? 0)),
      totalCost: sum(messages.map(m => m.cost ?? 0)),
      byTeacher: groupBy(messages, "teacherId"),
    };
  },
});
```

### 4. Alerts and Limits

* Log warning when teacher exceeds threshold (e.g., $5/month)
* Optional: Rate limiting per teacher
* Email alerts for unusual usage patterns

## Acceptance Criteria

- [ ] Token usage tracked for every agent response
- [ ] Cost calculated and stored per message
- [ ] Usage stats query available
- [ ] Cost calculation accurate for different models
- [ ] Logging for cost monitoring
- [ ] Optional: Dashboard to view usage
- [ ] Optional: Alerts for high usage
- [ ] Documentation on cost optimization strategies

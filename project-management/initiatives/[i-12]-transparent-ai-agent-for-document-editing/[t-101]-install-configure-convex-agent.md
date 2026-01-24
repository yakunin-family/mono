---
status: todo
priority: high
description: Install @convex-dev/agent and configure component in backend
tags: [ai, editor, streaming]
---

# Install and configure Convex Agent component

Set up the Convex Agent component which provides built-in support for tool calling, streaming, and message persistence.

## Requirements

1. Install `@convex-dev/agent` package in `apps/backend`
2. Create `convex/convex.config.ts` with agent component registration:

   ```ts
   import { defineApp } from "convex/server";
   import agent from "@convex-dev/agent/convex.config";

   const app = defineApp();
   app.use(agent);
   export default app;
   ```

3. Run `npx convex dev` to generate component code
4. Verify component is available and working

## Files

- `apps/backend/package.json`
- `apps/backend/convex/convex.config.ts`

## Acceptance Criteria

- [ ] Package installed successfully
- [ ] Component config file created
- [ ] `npx convex dev` generates agent component code without errors
- [ ] Component tables are created in Convex dashboard

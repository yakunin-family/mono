import { definePlaygroundAPI } from "@convex-dev/agent";

import { components } from "./_generated/api";
import { documentEditorAgent } from "./agents/documentEditor";

/**
 * Playground API for debugging and testing agents.
 *
 * Authorization is handled by passing an apiKey that can be generated via:
 *   npx convex run --component agent apiKeys:issue '{name:"dev-playground"}'
 *
 * Access the playground at: https://get-convex.github.io/agent/
 * Or run locally with: npx @convex-dev/agent-playground
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [documentEditorAgent],
});

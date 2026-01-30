import { Agent } from "@convex-dev/agent";
import { latest } from "@package/ai-agent";
import { gateway, stepCountIs } from "ai";

import { components } from "../_generated/api";

/**
 * Document Editor Agent
 *
 * An AI assistant that helps language teachers create and edit educational documents.
 * It can have conversations, load specialized exercise creation instructions, and
 * modify documents only when explicitly requested.
 */
export const documentEditorAgent = new Agent(components.agent, {
  name: "Document Editor",
  languageModel: gateway("openai/gpt-5.2"),
  instructions: latest.basePrompt,
  tools: latest.tools,
  // Allow the agent to continue after tool calls (up to 10 steps)
  // Without this, the default is stepCountIs(1) which stops immediately
  stopWhen: stepCountIs(10),
});

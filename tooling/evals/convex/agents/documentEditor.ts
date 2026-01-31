import { Agent } from "@convex-dev/agent";
import { latest } from "@package/ai-agent";
import { gateway, stepCountIs } from "ai";

import { components } from "../_generated/api";

export const documentEditorAgent = new Agent(components.agent, {
  name: "Eval Document Editor",
  languageModel: gateway("openai/gpt-5.2"),
  instructions: latest.basePrompt,
  tools: latest.tools,
  stopWhen: stepCountIs(10),
});

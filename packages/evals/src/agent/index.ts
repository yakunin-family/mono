import { streamText, type LanguageModel } from "ai";
import { loadSkill, editDocument, patchDocument } from "./tools.js";
import {
  getChatBasePrompt,
  getSkillFillBlanks,
  getSkillMultipleChoice,
  getSkillSequencing,
  getSkillShortAnswer,
  getSkillTrueFalse,
  getSkillWritingExercises,
  type ChatSkillName,
} from "./prompts.js";

const SKILL_GETTERS: Record<ChatSkillName, () => string> = {
  "fill-blanks": getSkillFillBlanks,
  "multiple-choice": getSkillMultipleChoice,
  sequencing: getSkillSequencing,
  "short-answer": getSkillShortAnswer,
  "true-false": getSkillTrueFalse,
  "writing-exercises": getSkillWritingExercises,
};

export interface AgentResult {
  output: string;
  toolCalls: unknown[];
  usage: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
}

export async function runAgent(
  documentXml: string,
  instruction: string,
  skill?: ChatSkillName,
): Promise<AgentResult> {
  const system = skill
    ? `${getChatBasePrompt()}\n\n${SKILL_GETTERS[skill]()}`
    : getChatBasePrompt();

  const result = await streamText({
    model: "deepseek/deepseek-v3.2",
    system,
    messages: [{ role: "user", content: instruction }],
    tools: { loadSkill, editDocument, patchDocument },
  });

  const [text, toolCalls, usage] = await Promise.all([
    result.text,
    result.toolCalls,
    result.usage,
  ]);

  return {
    output: text,
    toolCalls,
    usage: {
      totalTokens: usage?.totalTokens ?? 0,
      inputTokens: usage?.inputTokens ?? 0,
      outputTokens: usage?.outputTokens ?? 0,
    },
  };
}

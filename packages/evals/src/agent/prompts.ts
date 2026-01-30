export function getChatBasePrompt(): string {
  return "You are an AI assistant helping language teachers create educational documents.";
}

export function getSkillFillBlanks(): string {
  return "Fill-blanks skill instructions placeholder.";
}

export function getSkillMultipleChoice(): string {
  return "Multiple-choice skill instructions placeholder.";
}

export function getSkillSequencing(): string {
  return "Sequencing skill instructions placeholder.";
}

export function getSkillShortAnswer(): string {
  return "Short-answer skill instructions placeholder.";
}

export function getSkillTrueFalse(): string {
  return "True-false skill instructions placeholder.";
}

export function getSkillWritingExercises(): string {
  return "Writing-exercises skill instructions placeholder.";
}

export const CHAT_SKILL_NAMES = [
  "fill-blanks",
  "multiple-choice",
  "sequencing",
  "short-answer",
  "true-false",
  "writing-exercises",
] as const;

export type ChatSkillName = (typeof CHAT_SKILL_NAMES)[number];

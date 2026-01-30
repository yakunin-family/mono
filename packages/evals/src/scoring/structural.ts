export function hasExerciseContainer(xml: string): boolean {
  return xml.includes("<exercise") && xml.includes("</exercise>");
}

export function hasBlanks(xml: string): boolean {
  return xml.includes("<blank");
}

export function hasMultipleChoice(xml: string): boolean {
  return xml.includes("<multipleChoice");
}

export function hasSequencing(xml: string): boolean {
  return xml.includes("<sequencing");
}

export function hasShortAnswer(xml: string): boolean {
  return xml.includes("<shortAnswer");
}

export function hasTrueFalse(xml: string): boolean {
  return xml.includes("<trueFalse");
}

export function hasWritingArea(xml: string): boolean {
  return xml.includes("<writingArea");
}

export function countBlanks(xml: string): number {
  const matches = xml.match(/<blank/g);
  return matches ? matches.length : 0;
}

export function validateXmlStructure(xml: string): {
  valid: boolean;
  error?: string;
} {
  if (!xml.trim()) {
    return { valid: false, error: "Empty XML" };
  }
  // Check for balanced tags could be added
  return { valid: true };
}

export function scoreStructural(xml: string, testCase: any): any {
  return {
    passed: true,
  };
}

export type StructuralScore = {
  passed: boolean;
};

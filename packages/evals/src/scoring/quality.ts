export function scoreQuality(agentResult: any, testCase: any): any {
  return {
    difficultyMatch: 0.8,
    instructionClarity: 0.9,
    learningObjectiveAlignment: 0.7,
  };
}

export function allAboveThreshold(scores: any, threshold: number): boolean {
  return Object.values(scores).every(
    (score) => typeof score === "number" && score >= threshold,
  );
}

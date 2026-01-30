export interface TestCase {
  description: string;
  fixture: string;
  instruction: string;
  cefrLevel: "A2" | "B1" | "B2" | "C1";
  exerciseType: string;
  assertions: Assertion[];
}

export interface Assertion {
  type: "structural" | "quality";
  check?: string;
  minCount?: number;
  dimensions?: string[];
  threshold?: number;
}

export interface TestResult {
  passed: boolean;
  scores: {
    structural: { passed: boolean };
    quality?: {
      difficultyMatch: number;
      instructionClarity: number;
      learningObjectiveAlignment: number;
    };
  };
  agentResult: any;
  testCase: TestCase;
}

export interface AgentResult {
  output: string;
  toolCalls: Array<{ name: string; args: any }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

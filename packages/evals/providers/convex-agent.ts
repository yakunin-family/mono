// Promptfoo custom provider for Convex agent evaluation.
// This class-based provider is loaded via `file://` in promptfooconfig.yaml.

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

interface EvalResponse {
  output: string;
  toolCalls: ToolCall[];
  steps: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface SetupResponse {
  teacherId: string;
  studentId: string;
  spaceId: string;
  documentId: string;
  cleanupToken: string;
  message: string;
}

interface ProviderResponse {
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface ProviderContext {
  vars?: Record<string, string>;
}

interface ProviderConfig {
  convexUrl?: string;
  evalApiKey?: string;
  timeoutMs?: number;
  setupBeforeEval?: boolean;
  cleanupAfterEval?: boolean;
}

interface ProviderOptions {
  id?: string;
  config?: ProviderConfig;
}

const DEFAULT_TIMEOUT_MS = 60_000;

class ConvexAgentProvider {
  private convexUrl: string;
  private evalApiKey: string;
  private timeoutMs: number;
  private setupBeforeEval: boolean;
  private cleanupAfterEval: boolean;

  constructor(options?: ProviderOptions) {
    this.convexUrl = options?.config?.convexUrl || process.env.CONVEX_URL || "";
    this.evalApiKey =
      options?.config?.evalApiKey || process.env.EVAL_API_KEY || "";
    this.timeoutMs = options?.config?.timeoutMs || DEFAULT_TIMEOUT_MS;
    this.setupBeforeEval = options?.config?.setupBeforeEval ?? true;
    this.cleanupAfterEval = options?.config?.cleanupAfterEval ?? false;
  }

  id(): string {
    return "convex-agent";
  }

  private async callEvalEndpoint<T>(
    endpoint: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.convexUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Eval-Api-Key": this.evalApiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async setupEvalEnvironment(): Promise<SetupResponse> {
    return this.callEvalEndpoint<SetupResponse>("/eval/setup");
  }

  async cleanupEvalEnvironment(): Promise<{
    message: string;
    cleaned: boolean;
  }> {
    return this.callEvalEndpoint("/eval/cleanup");
  }

  async callApi(
    prompt: string,
    context?: ProviderContext,
  ): Promise<ProviderResponse> {
    if (!this.convexUrl || !this.evalApiKey) {
      return {
        output: "",
        error:
          "Missing required config: convexUrl and evalApiKey must be set via config or environment variables (CONVEX_URL, EVAL_API_KEY)",
      };
    }

    // Optional: Setup eval environment before running eval
    let setupData: SetupResponse | undefined;
    if (this.setupBeforeEval) {
      try {
        setupData = await this.setupEvalEnvironment();
      } catch (err) {
        return {
          output: "",
          error: `Failed to setup eval environment: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        };
      }
    }

    const documentXml = context?.vars?.documentXml ?? "";

    try {
      const data = await this.callEvalEndpoint<EvalResponse>("/eval/run", {
        documentXml,
        instruction: prompt,
      });

      // Optional: Cleanup after eval completes
      if (this.cleanupAfterEval) {
        try {
          await this.cleanupEvalEnvironment();
        } catch {
          // Log but don't fail the eval if cleanup fails
          console.warn("Failed to cleanup eval environment after eval");
        }
      }

      return {
        output: data.output,
        metadata: {
          toolCalls: data.toolCalls,
          steps: data.steps,
          usage: data.usage,
          setupData,
        },
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      return {
        output: "",
        error: message,
      };
    }
  }
}

export default ConvexAgentProvider;

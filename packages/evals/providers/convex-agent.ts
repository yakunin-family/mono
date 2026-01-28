// Promptfoo loads this file directly via `file:` in promptfooconfig.yaml.
// The provider interface is duck-typed — no imports from promptfoo needed.
// Environment variables (CONVEX_URL, EVAL_API_KEY) are injected by Promptfoo
// from the config's ${...} variable references.

declare const process: { env: Record<string, string | undefined> };

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

interface ProviderResponse {
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface ProviderContext {
  vars?: Record<string, string>;
}

const TIMEOUT_MS = 60_000;

const provider = {
  id(): string {
    return "convex-agent";
  },

  async callApi(
    prompt: string,
    context?: ProviderContext,
  ): Promise<ProviderResponse> {
    const convexUrl = process.env.CONVEX_URL;
    const evalApiKey = process.env.EVAL_API_KEY;

    if (!convexUrl || !evalApiKey) {
      return {
        output: "",
        error:
          "Missing required environment variables: CONVEX_URL and EVAL_API_KEY",
      };
    }

    const documentXml = context?.vars?.documentXml ?? "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${convexUrl}/eval/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Eval-Api-Key": evalApiKey,
        },
        body: JSON.stringify({
          documentXml,
          instruction: prompt,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        return {
          output: "",
          error: `HTTP ${response.status}: ${errorBody}`,
        };
      }

      const data: EvalResponse = await response.json();

      return {
        output: data.output,
        metadata: {
          toolCalls: data.toolCalls,
          steps: data.steps,
          usage: data.usage,
        },
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          output: "",
          error: "Agent timed out after 60s",
        };
      }

      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      return {
        output: "",
        error: message,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

export default provider;

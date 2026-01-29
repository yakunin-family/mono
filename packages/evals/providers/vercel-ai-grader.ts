// Custom grader provider using Vercel AI Gateway
import { generateText, LanguageModel } from "ai";

interface ProviderResponse {
  output?: string;
  error?: string;
  tokenUsage?: {
    total: number;
    prompt: number;
    completion: number;
  };
}

interface ProviderOptions {
  id?: string;
  config?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

class VercelAIGatewayGrader {
  private model: LanguageModel;
  private temperature: number;
  private apiKey: string;

  constructor(options?: ProviderOptions) {
    this.apiKey =
      options?.config?.apiKey || process.env.AI_GATEWAY_API_KEY || "";
    this.model = options?.config?.model || "openai/gpt-4o-mini";
    this.temperature = options?.config?.temperature ?? 0.3;
  }

  id(): string {
    return "vercel-ai-gateway-grader";
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    if (!this.apiKey) {
      return {
        output: "",
        error:
          "Missing AI_GATEWAY_API_KEY environment variable or apiKey in config",
      };
    }

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: this.temperature,
      });

      return {
        output: result.text,
        tokenUsage: {
          total: result.usage?.totalTokens ?? 0,
          prompt: result.usage?.inputTokens ?? 0,
          completion: result.usage?.outputTokens ?? 0,
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

export default VercelAIGatewayGrader;

import { httpAction } from "./_generated/server";

import { documentEditorAgent } from "./agents/documentEditor";

interface CapturedToolCall {
  name: string;
  args: Record<string, unknown>;
}

interface EvalRequestBody {
  documentXml: string;
  instruction: string;
}

interface EvalResponse {
  output: string;
  toolCalls: CapturedToolCall[];
  steps: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Eval endpoint for invoking the document editor agent without auth.
 * Secured via X-Eval-Api-Key header — the API key IS the access guard.
 */
export const runAgentEval = httpAction(async (ctx, request) => {
  const apiKey = request.headers.get("X-Eval-Api-Key");
  const expectedKey = process.env.EVAL_API_KEY;

  if (!apiKey || !expectedKey || apiKey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: invalid or missing API key" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: EvalRequestBody;
  try {
    const raw = await request.json();
    if (
      typeof raw.documentXml !== "string" ||
      typeof raw.instruction !== "string"
    ) {
      throw new Error("Missing required fields");
    }
    body = raw as EvalRequestBody;
  } catch {
    return new Response(
      JSON.stringify({
        error:
          "Bad request: body must be JSON with { documentXml: string, instruction: string }",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { threadId } = await documentEditorAgent.createThread(ctx, {
    userId: "eval-test-user",
  });

  try {
    const { thread } = await documentEditorAgent.continueThread(ctx, {
      threadId,
      userId: "eval-test-user",
    });

    const toolCalls: CapturedToolCall[] = [];
    let stepCount = 0;

    const result = await thread.streamText(
      {
        system: `Current document XML:\n\n${body.documentXml}`,
        messages: [
          {
            role: "user",
            content: body.instruction,
          },
        ],
        onStepFinish: async (step) => {
          stepCount++;
          if (step.toolCalls) {
            for (const tc of step.toolCalls) {
              toolCalls.push({
                name: tc.toolName,
                args: tc.input as Record<string, unknown>,
              });
            }
          }
        },
      },
      {
        storageOptions: { saveMessages: "promptAndOutput" },
      },
    );

    await result.consumeStream();

    const output = await result.text;
    const usage = await result.usage;

    const response: EvalResponse = {
      output,
      toolCalls,
      steps: stepCount,
      usage: {
        promptTokens: usage.inputTokens ?? 0,
        completionTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await documentEditorAgent.deleteThreadAsync(ctx, { threadId });
  }
});

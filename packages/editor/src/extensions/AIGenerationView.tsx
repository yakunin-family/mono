import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Loader2Icon, SparklesIcon, TrashIcon, XIcon, CheckIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@mono/ui";
import type { ConvexReactClient } from "convex/react";
import { api } from "@mono/backend";

const HARDCODED_MODEL = "openai/gpt-4o";

export function AIGenerationView({
  node,
  getPos,
  editor,
  updateAttributes,
}: NodeViewProps) {
  const [promptText, setPromptText] = useState(
    node.attrs.promptText as string || ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = node.attrs.status as string;
  const generationId = node.attrs.generationId as string | null;

  // Get Convex client from editor storage
  const convexClient = (editor.storage as any).aiGeneration?.convexClient as
    | ConvexReactClient
    | undefined;

  // Real-time subscription to generation data
  const [generation, setGeneration] = useState<any>(null);

  useEffect(() => {
    if (!convexClient || !generationId) return;

    // Set up reactive query subscription
    const watch = convexClient.watchQuery(api.ai.getGeneration, {
      generationId: generationId as any,
    });

    const unsubscribe = watch.onUpdate(() => {
      setGeneration(watch.localQueryResult());
    });

    return () => {
      unsubscribe();
    };
  }, [convexClient, generationId]);

  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptClick = async () => {
    if (!convexClient || !generationId || !generation?.generatedContent) return;

    setIsAccepting(true);
    try {
      await convexClient.mutation(api.ai.markGenerationAccepted, {
        generationId: generationId as any,
      });
      handleAccept(generation.generatedContent);
    } catch (error) {
      console.error("Failed to accept generation:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAccept = (content: string) => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const nodeSize = editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;

    // Insert generated content at current position
    editor
      .chain()
      .focus()
      .insertContentAt(pos, content, { updateSelection: false })
      .deleteRange({
        from: pos + content.length,
        to: pos + content.length + nodeSize,
      })
      .run();
  };

  const handleRegenerate = async () => {
    // Create new generation with same prompt
    setError(null);
    setIsGenerating(true);

    try {
      const createGeneration = (editor.storage as any).aiGeneration
        ?.createGeneration as
        | ((
            promptText: string,
            model: string,
          ) => Promise<{ generationId: string; streamId: string }>)
        | undefined;

      if (!createGeneration) {
        throw new Error(
          "No createGeneration callback provided. Please configure the editor with onCreateGeneration prop.",
        );
      }

      const result = await createGeneration(promptText, HARDCODED_MODEL);

      // Update node attributes with new generation info
      updateAttributes({
        generationId: result.generationId,
        status: "pending",
        promptText: promptText,
      });
    } catch (err) {
      console.error("Failed to regenerate:\n", err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate content",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = () => {
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (pos === undefined) return;

    const nodeSize = editor.state.doc.nodeAt(pos)?.nodeSize ?? 0;
    editor.commands.deleteRange({
      from: pos,
      to: pos + nodeSize,
    });
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Get the callback from editor storage
      const createGeneration = (editor.storage as any).aiGeneration
        ?.createGeneration as
        | ((
            promptText: string,
            model: string,
          ) => Promise<{ generationId: string; streamId: string }>)
        | undefined;

      if (!createGeneration) {
        throw new Error(
          "No createGeneration callback provided. Please configure the editor with onCreateGeneration prop.",
        );
      }

      const result = await createGeneration(promptText, HARDCODED_MODEL);

      // Update node attributes with generation info
      updateAttributes({
        generationId: result.generationId,
        status: "pending",
        promptText: promptText,
      });
    } catch (err) {
      console.error("Failed to create AI generation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create generation",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <NodeViewWrapper className="my-4 block group">
      <div className="rounded-lg border border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 p-4 shadow-sm transition-all hover:border-purple-500 hover:shadow-md">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
            <SparklesIcon className="h-4 w-4" />
            <span>AI Content Generation</span>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              contentEditable={false}
              onClick={handleDelete}
              title="Delete AI generation"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Input State */}
        {status === "input" && (
          <div className="space-y-3" contentEditable={false}>
            <div>
              <label
                htmlFor="ai-prompt"
                className="mb-1.5 block text-sm text-muted-foreground"
              >
                What would you like to create?
              </label>
              <textarea
                id="ai-prompt"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., 'Create an exercise about quadratic equations' or 'Explain the photosynthesis process'"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                rows={3}
                disabled={isGenerating}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tip: Press Cmd/Ctrl+Enter to generate
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim()}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pending State - Initial loading before generation data arrives */}
        {(status === "pending" || generation?.status === "pending") && !generation?.generatedContent && (
          <div
            className="flex items-center gap-3 py-4 text-sm text-muted-foreground"
            contentEditable={false}
          >
            <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
            <div>
              <p className="font-medium text-foreground">Initializing generation...</p>
              <p className="text-xs">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Streaming State - Real-time content display */}
        {generation?.status === "streaming" && (
          <div className="space-y-2" contentEditable={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Streaming...
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Model: {generation.model}
              </span>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {generation.generatedContent}
              <span className="inline-block w-0.5 h-4 bg-purple-600 animate-pulse ml-0.5 align-middle">
                ▊
              </span>
            </div>
          </div>
        )}

        {/* Completed State - Show Accept/Regenerate buttons */}
        {generation?.status === "completed" && (
          <div className="space-y-3" contentEditable={false}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Generation Complete
              </span>
              {generation.tokensUsed && (
                <span className="text-xs text-muted-foreground">
                  {generation.tokensUsed} tokens
                </span>
              )}
            </div>

            <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {generation.generatedContent}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RotateCcwIcon className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptClick}
                disabled={isAccepting || !!generation.acceptedBy}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {generation.acceptedBy ? "Accepted" : "Accept"}
              </Button>
            </div>

            {generation.acceptedBy && (
              <p className="text-xs text-muted-foreground text-center">
                Content accepted and inserted into document
              </p>
            )}
          </div>
        )}

        {/* Failed State - Show error with retry option */}
        {generation?.status === "failed" && (
          <div className="space-y-3" contentEditable={false}>
            <div className="rounded-md bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <XCircleIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Generation Failed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {generation.errorMessage || "Unknown error occurred"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RotateCcwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

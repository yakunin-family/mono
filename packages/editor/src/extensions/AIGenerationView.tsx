import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Loader2Icon, SparklesIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@mono/ui";

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

        {/* Pending State (will be enhanced in Phase 3) */}
        {status === "pending" && (
          <div
            className="flex items-center gap-3 py-4 text-sm text-muted-foreground"
            contentEditable={false}
          >
            <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
            <div>
              <p className="font-medium text-foreground">Generating content...</p>
              <p className="text-xs">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Note: Streaming, Completed, and Failed states will be added in Phase 3 */}
      </div>
    </NodeViewWrapper>
  );
}

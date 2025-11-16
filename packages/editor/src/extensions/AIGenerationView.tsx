import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  Loader2Icon,
  SparklesIcon,
  TrashIcon,
  XIcon,
  CheckIcon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@package/ui";
import { useConvex } from "convex/react";
import { api } from "@app/backend";

const HARDCODED_MODEL = "openai/gpt-4o";

/**
 * Parse markdown content to Tiptap JSON nodes.
 * Supports: headings, lists, bold, italic, strikethrough, code, links, and paragraphs.
 */
function parseMarkdownToNodes(markdown: string): any[] {
  const lines = markdown.split("\n");
  const nodes: any[] = [];
  let currentParagraph: string[] = [];
  let currentList: {
    type: "bulletList" | "orderedList";
    items: string[];
  } | null = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join("\n").trim();
      if (text) {
        nodes.push({
          type: "paragraph",
          content: parseInlineContent(text),
        });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      nodes.push({
        type: currentList.type,
        content: currentList.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineContent(item),
            },
          ],
        })),
      });
      currentList = null;
    }
  };

  for (const line of lines) {
    // Detect headings (# Heading)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      nodes.push({
        type: "heading",
        attrs: { level },
        content: parseInlineContent(headingMatch[2]),
      });
      continue;
    }

    // Detect bullet lists (- item or * item)
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      flushParagraph();
      if (!currentList || currentList.type !== "bulletList") {
        flushList();
        currentList = { type: "bulletList", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Detect ordered lists (1. item)
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch && orderedMatch[1]) {
      flushParagraph();
      if (!currentList || currentList.type !== "orderedList") {
        flushList();
        currentList = { type: "orderedList", items: [] };
      }
      currentList.items.push(orderedMatch[1]);
      continue;
    }

    // Empty line = paragraph/list break
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    // Regular line - add to current paragraph
    flushList(); // Lists must end before paragraphs
    currentParagraph.push(line);
  }

  // Flush remaining content
  flushParagraph();
  flushList();

  // If no nodes were created, create a single paragraph with the original text
  if (nodes.length === 0 && markdown.trim()) {
    nodes.push({
      type: "paragraph",
      content: [{ type: "text", text: markdown.trim() }],
    });
  }

  return nodes;
}

/**
 * Parse inline markdown formatting (bold, italic, code, strikethrough, links).
 */
function parseInlineContent(text: string): any[] {
  const tokens: any[] = [];
  let remaining = text;
  let position = 0;

  // Regex patterns for inline formatting (ordered by priority)
  const patterns = [
    // Links [text](url)
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/,
      handler: (match: RegExpMatchArray) => ({
        type: "text",
        marks: [{ type: "link", attrs: { href: match[2] } }],
        text: match[1],
      }),
    },
    // Bold **text** or __text__
    {
      regex: /\*\*([^*]+)\*\*|__([^_]+)__/,
      handler: (match: RegExpMatchArray) => ({
        type: "text",
        marks: [{ type: "bold" }],
        text: match[1] || match[2],
      }),
    },
    // Italic *text* or _text_
    {
      regex: /\*([^*]+)\*|_([^_]+)_/,
      handler: (match: RegExpMatchArray) => ({
        type: "text",
        marks: [{ type: "italic" }],
        text: match[1] || match[2],
      }),
    },
    // Strikethrough ~~text~~
    {
      regex: /~~([^~]+)~~/,
      handler: (match: RegExpMatchArray) => ({
        type: "text",
        marks: [{ type: "strike" }],
        text: match[1],
      }),
    },
    // Inline code `code`
    {
      regex: /`([^`]+)`/,
      handler: (match: RegExpMatchArray) => ({
        type: "text",
        marks: [{ type: "code" }],
        text: match[1],
      }),
    },
  ];

  while (remaining.length > 0) {
    let matched = false;

    // Try each pattern
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index !== undefined) {
        // Add text before the match
        if (match.index > 0) {
          tokens.push({
            type: "text",
            text: remaining.slice(0, match.index),
          });
        }

        // Add the formatted text
        tokens.push(pattern.handler(match));

        // Update remaining text
        remaining = remaining.slice(match.index + match[0].length);
        matched = true;
        break;
      }
    }

    // If no pattern matched, add remaining text and break
    if (!matched) {
      if (remaining) {
        tokens.push({
          type: "text",
          text: remaining,
        });
      }
      break;
    }
  }

  // If no tokens were created, return plain text
  if (tokens.length === 0 && text) {
    return [{ type: "text", text }];
  }

  return tokens;
}

export function AIGenerationView({
  node,
  getPos,
  editor,
  updateAttributes,
}: NodeViewProps) {
  const [promptText, setPromptText] = useState(
    (node.attrs.promptText as string) || "",
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = node.attrs.status as string;
  const generationId = node.attrs.generationId as string | null;
  const convexClient = useConvex();

  // Real-time subscription to generation data
  const [generation, setGeneration] = useState<any>(null);

  useEffect(() => {
    if (!convexClient || !generationId) return;

    // Set up reactive query subscription
    const watch = convexClient.watchQuery(api.ai.getGeneration, {
      generationId,
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

    // Parse markdown content to Tiptap nodes
    const parsedNodes = parseMarkdownToNodes(content);

    // Delete AI generation node first, then insert parsed content
    // This avoids complex position calculations after insertion
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + nodeSize })
      .insertContentAt(pos, parsedNodes, { updateSelection: false })
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
        {(status === "pending" || generation?.status === "pending") &&
          !generation?.generatedContent && (
            <div
              className="flex items-center gap-3 py-4 text-sm text-muted-foreground"
              contentEditable={false}
            >
              <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
              <div>
                <p className="font-medium text-foreground">
                  Initializing generation...
                </p>
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

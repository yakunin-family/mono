import type { UIMessage } from "@convex-dev/agent/react";
import type { DocumentOperation, OperationResult } from "@package/editor";
import { cn, ScrollArea } from "@package/ui";
import {
  CheckIcon,
  FileIcon,
  Loader2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef } from "react";

import { ChatMarkdown } from "./chat-markdown";
import type {
  ApplyAIResponseResult,
  EditResultsMap,
  OperationResultsMap,
} from "./use-chat";

interface ChatMessagesProps {
  messages: UIMessage[];
  operationResults: OperationResultsMap;
  editResults: EditResultsMap;
  isLoading?: boolean;
}

export function ChatMessages({
  messages,
  operationResults,
  editResults,
  isLoading,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        {isEmpty && <WelcomeMessage />}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            operationResults={operationResults.get(message.id)}
            editResult={editResults.get(message.id)}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <SparklesIcon className="size-6 text-primary" />
      </div>
      <h3 className="mb-2 text-sm font-medium">AI Assistant</h3>
      <p className="max-w-[240px] text-xs text-muted-foreground">
        Ask me to help with your lesson. I can create exercises, edit content,
        and answer questions.
      </p>
    </div>
  );
}

interface MessageBubbleProps {
  message: UIMessage;
  operationResults?: OperationResult[];
  editResult?: ApplyAIResponseResult;
}

function MessageBubble({
  message,
  operationResults,
  editResult,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex", {
        "justify-end": isUser,
        "justify-start": !isUser,
      })}
    >
      <div
        className={cn("max-w-[85%] space-y-2", {
          "flex flex-col items-end": isUser,
        })}
      >
        {message.parts.map((part, index) => (
          <MessagePart
            key={index}
            part={part}
            isUser={isUser}
            operationResults={operationResults}
            editResult={editResult}
          />
        ))}
      </div>
    </div>
  );
}

interface MessagePartProps {
  part: UIMessage["parts"][number];
  isUser: boolean;
  operationResults?: OperationResult[];
  editResult?: ApplyAIResponseResult;
}

function MessagePart({
  part,
  isUser,
  operationResults,
  editResult,
}: MessagePartProps) {
  // Cast to access type property safely
  const partType = part.type as string;

  switch (partType) {
    case "text":
      if (!("text" in part) || !part.text.trim()) return null;
      return (
        <div
          className={cn("rounded-2xl px-3 py-2 text-sm", {
            "bg-primary text-primary-foreground": isUser,
            "bg-muted": !isUser,
          })}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{part.text}</p>
          ) : (
            <ChatMarkdown content={part.text} />
          )}
        </div>
      );

    case "reasoning":
      if (!("text" in part)) return null;
      return (
        <div className="rounded-2xl bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
          <p className="whitespace-pre-wrap">{part.text}</p>
        </div>
      );

    case "image":
      return (
        <ImageAttachment
          part={
            part as unknown as {
              type: "image";
              image?: string | URL;
              mimeType?: string;
            }
          }
          isUser={isUser}
        />
      );

    case "file":
      return (
        <FileAttachment
          part={
            part as {
              type: "file";
              data?: string | URL;
              mimeType?: string;
              filename?: string;
            }
          }
          isUser={isUser}
        />
      );

    default:
      // Handle tool calls (both typed like "tool-editDocument" and dynamic)
      if (partType.startsWith("tool-") || partType === "dynamic-tool") {
        return (
          <ToolCallPart
            part={part}
            operationResults={operationResults}
            editResult={editResult}
          />
        );
      }
      return null;
  }
}

// =============================================================================
// File Attachments
// =============================================================================

interface ImageAttachmentProps {
  part: { type: "image"; image?: string | URL; mimeType?: string };
  isUser: boolean;
}

function ImageAttachment({ part, isUser }: ImageAttachmentProps) {
  const imageUrl =
    part.image instanceof URL ? part.image.toString() : part.image;

  if (!imageUrl) return null;

  return (
    <div
      className={cn("rounded-lg overflow-hidden", {
        "bg-primary/10": isUser,
        "bg-muted": !isUser,
      })}
    >
      <img
        src={imageUrl}
        alt="Attached image"
        className="max-h-48 max-w-full rounded-lg object-contain"
      />
    </div>
  );
}

interface FileAttachmentProps {
  part: {
    type: "file";
    data?: string | URL;
    mimeType?: string;
    filename?: string;
  };
  isUser: boolean;
}

function FileAttachment({ part, isUser }: FileAttachmentProps) {
  const filename = part.filename || "Attached file";

  return (
    <div
      className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm", {
        "bg-primary/10 text-primary-foreground": isUser,
        "bg-muted": !isUser,
      })}
    >
      <FileIcon className="size-4 shrink-0" />
      <span className="truncate max-w-[150px]">{filename}</span>
    </div>
  );
}

// =============================================================================
// Tool Output Types
// =============================================================================

interface PatchDocumentOutput {
  success: boolean;
  operationsJson?: string;
  summary?: string;
  error?: string;
}

interface EditDocumentOutput {
  success: boolean;
  documentXml?: string;
  summary?: string;
  error?: string;
}

interface LoadSkillOutput {
  success: boolean;
  instructions?: string;
}

type ToolOutput = PatchDocumentOutput | EditDocumentOutput | LoadSkillOutput;

// =============================================================================
// ToolCallPart - Enhanced with dynamic summaries and operation details
// =============================================================================

interface ToolCallPartProps {
  part: UIMessage["parts"][number];
  operationResults?: OperationResult[];
  editResult?: ApplyAIResponseResult;
}

function ToolCallPart({
  part,
  operationResults,
  editResult,
}: ToolCallPartProps) {
  // Extract tool name from part type
  const toolName =
    part.type === "dynamic-tool"
      ? (part as { toolName: string }).toolName
      : part.type.replace("tool-", "");

  // Get state and output if available
  const state = "state" in part ? part.state : undefined;
  const output = "output" in part ? (part.output as ToolOutput) : undefined;
  const errorText =
    "errorText" in part ? (part.errorText as string) : undefined;

  // Determine states
  const isComplete = state === "output-available";
  const isBackendError = state === "output-error";

  // For patchDocument, check if frontend application had errors
  const hasFrontendErrors =
    toolName === "patchDocument" && operationResults?.some((r) => !r.success);

  // For editDocument, check if frontend application failed
  const hasEditError =
    toolName === "editDocument" && editResult && !editResult.success;

  const hasAnyError = isBackendError || hasFrontendErrors || hasEditError;

  // Get summary text based on tool and state
  const getSummaryText = (): string => {
    // Backend error - show error message
    if (isBackendError) {
      const backendError =
        errorText ||
        (output && "error" in output ? output.error : null) ||
        "Operation failed";
      return backendError;
    }

    // Complete with output summary
    if (isComplete && output && "summary" in output && output.summary) {
      return output.summary;
    }

    // Still streaming - show generic action
    return getStreamingLabel(toolName);
  };

  // Get operations for patchDocument tool (parse from JSON string to avoid Convex nesting limits)
  const operations = useMemo((): DocumentOperation[] | undefined => {
    if (
      toolName !== "patchDocument" ||
      !output ||
      !("operationsJson" in output)
    ) {
      return undefined;
    }
    const json = output.operationsJson;
    if (typeof json !== "string") return undefined;
    try {
      return JSON.parse(json) as DocumentOperation[];
    } catch {
      console.error("Failed to parse operationsJson in chat display");
      return undefined;
    }
  }, [toolName, output]);

  // Determine if we should show operation details
  const showOperationDetails =
    toolName === "patchDocument" && operations && operations.length > 0;

  // Determine if we should show edit error
  const showEditError = hasEditError && editResult?.error;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border text-xs",
        hasAnyError
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/50 bg-muted/30",
      )}
    >
      {/* Header with summary */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5",
          hasAnyError ? "text-destructive" : "text-muted-foreground",
        )}
      >
        <ToolStateIcon
          state={state}
          hasError={hasFrontendErrors || hasEditError}
        />
        <span className="flex-1">{getSummaryText()}</span>
      </div>

      {/* Operation details for patchDocument */}
      {showOperationDetails && (
        <div className="border-t border-border/50 px-3 py-1.5">
          <div className="space-y-0.5">
            {operations.map((op, i) => (
              <OperationResultRow
                key={i}
                operation={op}
                result={operationResults?.[i]}
                isComplete={isComplete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit error details for editDocument */}
      {showEditError && (
        <div className="border-t border-destructive/20 px-3 py-1.5 text-destructive">
          Failed to apply: {editResult.error}
        </div>
      )}

      {/* Image analysis results */}
      {toolName === "analyzeImages" && isComplete && (
        <AnalyzeImagesOutput
          rawOutput={"output" in part ? part.output : undefined}
        />
      )}
    </div>
  );
}

// =============================================================================
// AnalyzeImagesOutput - Renders image analysis summaries or denial message
// =============================================================================

function AnalyzeImagesOutput({ rawOutput }: { rawOutput: unknown }): ReactNode {
  if (typeof rawOutput !== "string") return null;

  if (rawOutput === "User declined image analysis") {
    return (
      <div className="border-t border-border/50 px-3 py-1.5">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Image analysis declined
          </p>
          <p className="text-xs italic text-muted-foreground">
            Send a message to continue the conversation
          </p>
        </div>
      </div>
    );
  }

  let summaries: string[] = [];
  try {
    const parsed = JSON.parse(rawOutput);
    if (parsed && typeof parsed === "object" && "summaries" in parsed) {
      summaries = parsed.summaries as string[];
    }
  } catch {
    // If parsing fails, show nothing — raw output is not structured
  }

  if (summaries.length === 0) return null;

  return (
    <div className="border-t border-border/50 px-3 py-1.5">
      <div className="space-y-1">
        {summaries.map((summary, i) => (
          <p key={i} className="text-xs text-muted-foreground">
            {summary}
          </p>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// OperationResultRow - Shows individual operation status
// =============================================================================

interface OperationResultRowProps {
  operation: DocumentOperation;
  result?: OperationResult;
  isComplete: boolean;
}

function OperationResultRow({
  operation,
  result,
  isComplete,
}: OperationResultRowProps) {
  const opLabel = formatOperationLabel(operation);

  // If not complete yet, show spinner
  if (!isComplete) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Loader2Icon className="size-3 animate-spin" />
        <span>{opLabel}</span>
      </div>
    );
  }

  // If complete but no result tracked, assume success (shouldn't happen but be safe)
  const isSuccess = result?.success ?? true;
  const errorMessage = result && !result.success ? result.error : undefined;

  return (
    <div
      className={cn(
        "flex items-start gap-1.5",
        !isSuccess && "text-destructive",
      )}
    >
      {isSuccess ? (
        <CheckIcon className="mt-0.5 size-3 shrink-0 text-green-600" />
      ) : (
        <XIcon className="mt-0.5 size-3 shrink-0" />
      )}
      <span className="flex-1">
        {opLabel}
        {errorMessage && (
          <span className="text-destructive">: {errorMessage}</span>
        )}
      </span>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function ToolStateIcon({
  state,
  hasError,
}: {
  state: string | undefined;
  hasError?: boolean;
}) {
  // If frontend application had errors, show error icon even if backend succeeded
  if (hasError) {
    return <XIcon className="size-3 shrink-0" />;
  }

  switch (state) {
    case "input-streaming":
    case "input-available":
      return <Loader2Icon className="size-3 shrink-0 animate-spin" />;
    case "output-available":
      return <CheckIcon className="size-3 shrink-0 text-green-600" />;
    case "output-error":
      return <XIcon className="size-3 shrink-0" />;
    default:
      return <Loader2Icon className="size-3 shrink-0 animate-spin" />;
  }
}

function getStreamingLabel(toolName: string): string {
  const streamingLabels: Record<string, string> = {
    editDocument: "Rewriting document...",
    patchDocument: "Applying changes...",
    loadSkill: "Loading instructions...",
    analyzeImages: "Analyzing images...",
  };
  return streamingLabels[toolName] ?? `Running ${toolName}...`;
}

function formatOperationLabel(op: DocumentOperation): string {
  switch (op.op) {
    case "wrap":
      return `wrap ${op.ids.length} block${op.ids.length > 1 ? "s" : ""} in ${op.wrapper}`;
    case "unwrap":
      return "unwrap container";
    case "insert_after":
      return `insert ${op.block.type} after`;
    case "insert_before":
      return `insert ${op.block.type} before`;
    case "replace_block":
      return `replace with ${op.block.type}`;
    case "delete_block":
      return "delete block";
    case "set_content":
      return "update content";
    case "set_attrs":
      return "update attributes";
    default:
      return (op as DocumentOperation).op;
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="flex gap-1 rounded-2xl bg-muted px-3 py-2">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
      </div>
    </div>
  );
}

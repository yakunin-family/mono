import { Button, Card, cn, Textarea } from "@package/ui";
import { ArrowUpIcon } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = "Ask AI to edit your document...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isLoading;

  const handleSend = () => {
    if (!canSend) return;

    onSend(value.trim());
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 p-4">
      <Card className="flex flex-col gap-2 p-3">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="min-h-0 max-h-48 resize-none overflow-y-auto border-none bg-transparent p-0 text-sm focus-visible:ring-0"
          rows={1}
        />
        <div className="flex items-center justify-end">
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "rounded-full transition-colors",
              canSend
                ? "bg-foreground text-background hover:bg-foreground/80"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

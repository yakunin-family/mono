import { Button } from "@package/ui";
import { AlertCircle, ImageIcon, Loader2 } from "lucide-react";

interface ImagePlaceholderProps {
  state: "loading" | "error";
  onRetry?: () => void;
}

export function ImagePlaceholder({ state, onRetry }: ImagePlaceholderProps) {
  if (state === "loading") {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5">
      <div className="flex flex-col items-center gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium">Failed to load image</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-1"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

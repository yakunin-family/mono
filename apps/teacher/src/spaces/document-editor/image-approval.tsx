import { Button } from "@package/ui";
import { ImageIcon, Loader2Icon } from "lucide-react";

import type { PendingImageApproval } from "./use-chat";

interface ImageApprovalUIProps {
  pendingApproval: PendingImageApproval;
  onApprove: () => void;
  onDeny: () => void;
  isResolving?: boolean;
}

export function ImageApprovalUI({
  pendingApproval,
  onApprove,
  onDeny,
  isResolving = false,
}: ImageApprovalUIProps) {
  const imageCount = pendingApproval.storageIds.length;

  return (
    <div className="border-t px-4 py-3 bg-muted/30">
      <div className="flex items-start gap-2 mb-3">
        <ImageIcon className="size-4 shrink-0 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            AI wants to analyze {imageCount}{" "}
            {imageCount === 1 ? "image" : "images"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pendingApproval.reason}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onApprove} disabled={isResolving}>
          {isResolving && (
            <Loader2Icon className="mr-1.5 size-3 animate-spin" />
          )}
          Allow
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDeny}
          disabled={isResolving}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@package/ui";
import type { ComponentType } from "react";

interface ToolbarButtonProps {
  icon: ComponentType<{ className?: string }>;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ToolbarButton({
  icon: Icon,
  tooltip,
  isActive,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClick}
            disabled={disabled}
            className={cn(isActive && "bg-muted text-foreground")}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@package/ui";
import { LightbulbIcon } from "lucide-react";

interface HintTooltipProps {
  hint: string;
}

export function HintTooltip({ hint }: HintTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-yellow-500 focus:outline-none"
            onClick={() => setOpen(!open)}
            contentEditable={false}
            aria-label={`Hint: ${hint}`}
          >
            <LightbulbIcon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-[200px]">
          <p className="text-sm">{hint}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

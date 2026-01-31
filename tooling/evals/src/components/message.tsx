import { Card } from "@package/ui";
import type { UIMessage } from "@convex-dev/agent/react";

export function Message({ message }: { message: UIMessage }) {
  const role = message.role;

  const textParts = message.parts
    .map((p) => {
      if (p.type === "text") return p.text as string;
      try {
        return JSON.stringify(p);
      } catch {
        return String(p);
      }
    })
    .join("\n");

  return (
    <Card className={role === "assistant" ? "bg-white/80" : "bg-slate-50"}>
      <div className="text-sm text-slate-700 whitespace-pre-wrap">
        {textParts}
      </div>
    </Card>
  );
}

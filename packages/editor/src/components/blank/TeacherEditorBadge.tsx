import { useState, useRef, useEffect } from "react";
import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@package/ui";

import { HintTooltip } from "./HintTooltip";

interface TeacherEditorBadgeProps {
  correctAnswer: string;
  alternativeAnswers: string[];
  hint?: string | null;
  onEdit: (newAnswer: string) => void;
}

export function TeacherEditorBadge({
  correctAnswer,
  alternativeAnswers,
  hint,
  onEdit,
}: TeacherEditorBadgeProps) {
  const [isEditing, setIsEditing] = useState(correctAnswer === "");
  const [editValue, setEditValue] = useState(correctAnswer);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== correctAnswer) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(correctAnswer);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const hasAlternatives = alternativeAnswers.length > 0;

  return (
    <span className="inline-flex items-center gap-1">
      {!isEditing ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit correct answer"
                />
              }
            >
              {correctAnswer || "[blank]"}
            </TooltipTrigger>
            {hasAlternatives && (
              <TooltipContent>
                <p className="text-sm">
                  <span className="font-medium">Alternatives:</span>{" "}
                  {alternativeAnswers.join(", ")}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Enter answer..."
          className="inline-block rounded border-2 border-blue-500 bg-white px-2 py-0.5 text-sm focus:outline-none"
          style={{ width: `${Math.max(60, editValue.length * 8 + 20)}px` }}
          contentEditable={false}
          aria-label="Edit correct answer"
        />
      )}

      {hint && <HintTooltip hint={hint} />}
    </span>
  );
}

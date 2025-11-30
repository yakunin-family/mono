import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@package/ui";
import { Eye, Check, X, Circle } from "lucide-react";

import { HintTooltip } from "./HintTooltip";

interface TeacherLessonBlankProps {
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  hint?: string | null;
}

export function TeacherLessonBlank({
  studentAnswer,
  correctAnswer,
  isCorrect,
  hint,
}: TeacherLessonBlankProps) {
  const isEmpty = !studentAnswer || studentAnswer.trim() === "";

  return (
    <span className="inline-flex items-center gap-1">
      {/* Validation Icon */}
      <span
        className="inline-flex h-4 w-4 items-center justify-center"
        contentEditable={false}
      >
        {isEmpty ? (
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
        ) : isCorrect ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <X className="h-3.5 w-3.5 text-red-600" />
        )}
      </span>

      {/* Read-only Input */}
      <input
        type="text"
        value={studentAnswer}
        readOnly
        disabled
        className="inline-block min-w-[100px] max-w-[300px] border-0 border-b-2 border-dashed border-gray-300 bg-gray-50 px-1 text-gray-700"
        style={{ width: `${Math.max(100, studentAnswer.length * 8 + 20)}px` }}
      />

      {/* Peek Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-blue-600 focus:outline-none"
              contentEditable={false}
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              <span className="font-medium">Answer:</span> {correctAnswer}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Hint Icon */}
      {hint && <HintTooltip hint={hint} />}
    </span>
  );
}

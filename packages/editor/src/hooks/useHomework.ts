import { useConvex } from "convex/react";
import { api, type Id } from "@app/backend";
import { useCallback, useEffect, useState } from "react";

export interface HomeworkStatus {
  homeworkId: Id<"homeworkItems">;
  isCompleted: boolean;
  completedAt?: number;
  markedAt: number;
}

export interface UseHomeworkReturn {
  homeworkStatus: HomeworkStatus | null;
  isLoading: boolean;
  isToggling: boolean;
  toggleHomework: () => Promise<void>;
  completeHomework: () => Promise<void>;
  uncompleteHomework: () => Promise<void>;
  isCompletionToggling: boolean;
}

export function useHomework(
  documentId: string | undefined,
  exerciseInstanceId: string | undefined,
  enabled: boolean = true
): UseHomeworkReturn {
  const convex = useConvex();
  const [homeworkStatus, setHomeworkStatus] = useState<HomeworkStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isCompletionToggling, setIsCompletionToggling] = useState(false);

  useEffect(() => {
    if (!documentId || !exerciseInstanceId || !convex || !enabled) {
      setIsLoading(false);
      setHomeworkStatus(null);
      return;
    }

    setIsLoading(true);

    const watch = convex.watchQuery(api.homework.isExerciseHomework, {
      documentId: documentId as Id<"document">,
      exerciseInstanceId,
    });

    const unsubscribe = watch.onUpdate(() => {
      const result = watch.localQueryResult();
      setHomeworkStatus(result as HomeworkStatus | null);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [convex, documentId, exerciseInstanceId, enabled]);

  const toggleHomework = useCallback(async () => {
    if (!convex || !documentId || !exerciseInstanceId) {
      return;
    }

    setIsToggling(true);
    try {
      if (homeworkStatus?.homeworkId) {
        await convex.mutation(api.homework.removeFromHomework, {
          homeworkId: homeworkStatus.homeworkId,
        });
      } else {
        await convex.mutation(api.homework.markAsHomework, {
          documentId: documentId as Id<"document">,
          exerciseInstanceId,
        });
      }
    } finally {
      setIsToggling(false);
    }
  }, [convex, documentId, exerciseInstanceId, homeworkStatus?.homeworkId]);

  const completeHomework = useCallback(async () => {
    if (!convex || !homeworkStatus?.homeworkId) {
      return;
    }

    setIsCompletionToggling(true);
    try {
      await convex.mutation(api.homework.completeHomework, {
        homeworkId: homeworkStatus.homeworkId,
      });
    } finally {
      setIsCompletionToggling(false);
    }
  }, [convex, homeworkStatus?.homeworkId]);

  const uncompleteHomework = useCallback(async () => {
    if (!convex || !homeworkStatus?.homeworkId) {
      return;
    }

    setIsCompletionToggling(true);
    try {
      await convex.mutation(api.homework.uncompleteHomework, {
        homeworkId: homeworkStatus.homeworkId,
      });
    } finally {
      setIsCompletionToggling(false);
    }
  }, [convex, homeworkStatus?.homeworkId]);

  return {
    homeworkStatus,
    isLoading,
    isToggling,
    toggleHomework,
    completeHomework,
    uncompleteHomework,
    isCompletionToggling,
  };
}

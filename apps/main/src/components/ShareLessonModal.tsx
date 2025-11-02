import { convexQuery, useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mono/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface ShareLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
}

export function ShareLessonModal({
  isOpen,
  onClose,
  lessonId,
}: ShareLessonModalProps) {
  const queryClient = useQueryClient();
  const convex = useConvex();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Fetch all students
  const { data: allStudents = [] } = useQuery(
    convexQuery(api.students.getMyStudents, {}),
  );

  // Fetch students who already have access
  const { data: studentsWithAccess = [] } = useQuery(
    convexQuery(api.lessons.getLessonStudents, { lessonId: lessonId as any }),
  );

  const shareLessonMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      return convex.mutation(api.lessons.shareLessonWithStudents, {
        lessonId: lessonId as any,
        studentIds: studentIds as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["convex", api.lessons.getLessonStudents],
      });
      queryClient.invalidateQueries({
        queryKey: ["convex", api.lessons.getTeacherLessons],
      });
      setSelectedStudentIds([]);
      onClose();
    },
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleShare = () => {
    if (selectedStudentIds.length > 0) {
      shareLessonMutation.mutate(selectedStudentIds);
    }
  };

  if (!isOpen) return null;

  const studentsWithAccessIds = studentsWithAccess.map((s) => s._id);
  const availableStudents = allStudents.filter(
    (s) => !studentsWithAccessIds.includes(s._id),
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <Card>
          <CardHeader>
            <CardTitle>Share Lesson with Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {allStudents.length === 0
                  ? "No students created yet. Add students to share lessons with them."
                  : "All students already have access to this lesson."}
              </div>
            ) : (
              <>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <label
                      key={student._id}
                      className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selectedStudentIds.includes(student._id)}
                        onChange={() => toggleStudent(student._id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{student.nickname}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.linkedUserId ? "Active" : "Invite Pending"}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={shareLessonMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleShare}
                    disabled={
                      selectedStudentIds.length === 0 ||
                      shareLessonMutation.isPending
                    }
                  >
                    {shareLessonMutation.isPending
                      ? "Sharing..."
                      : `Share with ${selectedStudentIds.length} student${selectedStudentIds.length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              </>
            )}

            {studentsWithAccess.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="mb-2 text-sm font-medium">
                  Students with access:
                </h4>
                <div className="space-y-1">
                  {studentsWithAccess.map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <svg
                        className="size-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {student.nickname}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

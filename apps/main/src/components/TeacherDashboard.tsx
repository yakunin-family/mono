import { convexQuery, useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mono/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AddStudentModal } from "./AddStudentModal";

export function TeacherDashboard() {
  const navigate = useNavigate();
  const convex = useConvex();
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Fetch lessons
  const { data: lessons = [] } = useQuery(
    convexQuery(api.lessons.getTeacherLessons, {}),
  );

  // Fetch students
  const { data: students = [] } = useQuery(
    convexQuery(api.students.getMyStudents, {}),
  );

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async () => {
      return convex.mutation(api.lessons.createLesson, {
        title: `Lesson ${lessons.length + 1}`,
        description: "New lesson",
      });
    },
    onSuccess: (lessonId) => {
      navigate({ to: `/lesson/${lessonId}` });
    },
  });

  const handleCreateLesson = () => {
    createLessonMutation.mutate();
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      {/* Lessons Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Lessons</h2>
          <Button
            onClick={handleCreateLesson}
            disabled={createLessonMutation.isPending}
          >
            {createLessonMutation.isPending
              ? "Creating..."
              : "+ Create New Lesson"}
          </Button>
        </div>

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lessons yet. Create your first lesson to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Card
                key={lesson._id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate({ to: `/lesson/${lesson._id}` })}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {lesson.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {lesson.studentCount} student
                      {lesson.studentCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(lesson.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Students Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Students</h2>
          <Button onClick={() => setIsAddStudentModalOpen(true)}>
            + Add Student
          </Button>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No students yet. Add students to share lessons with them!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student._id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {student.studentName || "Pending signup"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`inline-block size-2 rounded-full ${
                          student.linkedUserId
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-muted-foreground">
                        {student.linkedUserId ? "Active" : "Invite Pending"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyInviteLink(student.inviteToken)}
                    >
                      Copy Invite Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
      />
    </div>
  );
}

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

  // Fetch students
  const { data: students = [] } = useQuery(
    convexQuery(api.students.getMyStudents, {}),
  );

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="space-y-8">
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

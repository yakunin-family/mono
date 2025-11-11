import { api } from "@mono/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mono/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { useState } from "react";

interface DocumentShareDialogProps {
  documentId: string;
  documentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentShareDialog({
  documentId,
  documentTitle,
  open,
  onOpenChange,
}: DocumentShareDialogProps) {
  const convex = useConvex();
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(),
  );

  // Fetch enrolled students
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      return await convex.query(api.teachers.getMyStudents, {});
    },
  });

  // Fetch students who already have access
  const sharedWithQuery = useQuery({
    queryKey: ["sharedWith", documentId],
    queryFn: async () => {
      return await convex.query(api.documents.getStudentsWithAccess, {
        documentId,
      });
    },
    enabled: open,
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await convex.mutation(api.documents.shareWithStudents, {
        documentId,
        studentIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sharedWith", documentId] });
      setSelectedStudents(new Set());
      onOpenChange(false);
    },
  });

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleShare = () => {
    if (selectedStudents.size > 0) {
      shareMutation.mutate(Array.from(selectedStudents));
    }
  };

  const sharedStudentIds = new Set(
    sharedWithQuery.data?.map((s) => s.studentId) || [],
  );

  // Filter out students who already have access
  const availableStudents =
    studentsQuery.data?.filter(
      (student) => !sharedStudentIds.has(student.studentId),
    ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" with your students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {studentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading students...</p>
          ) : availableStudents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                {sharedStudentIds.size > 0
                  ? "Already shared with all enrolled students"
                  : "No enrolled students yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableStudents.map((student) => (
                <label
                  key={student.studentId}
                  className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.studentId)}
                    onChange={() => handleToggleStudent(student.studentId)}
                    className="size-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{student.displayName}</span>
                </label>
              ))}
            </div>
          )}

          {sharedWithQuery.data && sharedWithQuery.data.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Already shared with:</p>
              <div className="space-y-1">
                {sharedWithQuery.data.map((student) => (
                  <div
                    key={student.studentId}
                    className="text-sm text-muted-foreground pl-3"
                  >
                    {student.displayName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={shareMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={selectedStudents.size === 0 || shareMutation.isPending}
          >
            {shareMutation.isPending ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

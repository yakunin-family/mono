import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mono/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
  const queryClient = useQueryClient();
  const convex = useConvex();
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const createStudentMutation = useMutation({
    mutationFn: async () => {
      return convex.mutation(api.students.createStudent, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["convex", api.students.getMyStudents],
      });
      // Generate invite link
      const link = `${window.location.origin}/join/${data.inviteToken}`;
      setInviteLink(link);
    },
  });

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
    }
  };

  const handleClose = () => {
    setInviteLink(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <Card>
          <CardHeader>
            <CardTitle>Create Student Invite Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!inviteLink ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Create an invite link that students can use to sign up and join
                    your class.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={createStudentMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => createStudentMutation.mutate()}
                      disabled={createStudentMutation.isPending}
                    >
                      {createStudentMutation.isPending
                        ? "Creating..."
                        : "Create Invite Link"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Share this link with your student:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                      />
                      <Button onClick={handleCopyLink}>Copy</Button>
                    </div>
                  </div>
                  <Button onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </>
              )}

              {createStudentMutation.isError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {createStudentMutation.error instanceof Error
                    ? createStudentMutation.error.message
                    : "Failed to create invite link. Please try again."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

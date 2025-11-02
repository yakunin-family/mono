import { convexQuery, useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@mono/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
});

function JoinPage() {
  const { token } = useParams({ from: "/join/$token" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const convex = useConvex();

  // Fetch student info by invite token
  const { data: student, isLoading } = useQuery(
    convexQuery(api.students.getStudentByInviteToken, { token }),
  );

  // Link student to current user
  const linkStudentMutation = useMutation({
    mutationFn: async () => {
      return convex.mutation(api.students.linkStudentToUser, {
        inviteToken: token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["convex", api.userProfiles.getUserProfile],
      });
      // Redirect to home/dashboard after linking
      navigate({ to: "/" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading invite...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This invite link is invalid or has expired.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (student.linkedUserId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invite Already Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This invite has already been accepted. If you think this is an
              error, please contact your teacher.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join as {student.nickname}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-muted-foreground">
              You've been invited to join the language learning platform!
            </p>
            <p className="text-sm text-muted-foreground">
              Your teacher has created a student account for you with the
              nickname <strong>{student.nickname}</strong>.
            </p>
          </div>

          <div className="rounded-md border bg-muted p-4">
            <h3 className="mb-2 font-medium">What happens next?</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Your account will be linked to this student profile</li>
              <li>• You'll get access to lessons from your teacher</li>
              <li>
                • You can collaborate in real-time on language learning
                exercises
              </li>
            </ul>
          </div>

          <Button
            onClick={() => linkStudentMutation.mutate()}
            disabled={linkStudentMutation.isPending}
            className="w-full"
          >
            {linkStudentMutation.isPending ? "Joining..." : "Accept Invite"}
          </Button>

          {linkStudentMutation.isError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {linkStudentMutation.error instanceof Error
                ? linkStudentMutation.error.message
                : "Failed to accept invite. Please try again."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

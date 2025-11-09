import { convexQuery, useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mono/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";

import { clearPendingInvite, storePendingInvite } from "@/lib/invite-storage";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
  loader: async ({ params, context }) => {
    // $token is actually the teacherUserId
    const teacherUserId = params.token;

    // Fetch teacher info for SSR
    const teacherInfo = await context.convexQueryClient.serverHttpClient?.query(
      api.teachers.getTeacherByUserId,
      { userId: teacherUserId },
    );

    return { teacherInfo };
  },
});

function JoinPage() {
  const { token: teacherUserId } = useParams({ from: "/join/$token" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const convex = useConvex();
  const { userId } = Route.useRouteContext();
  const loaderData = Route.useLoaderData();
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Check if already enrolled (only if authenticated)
  const { data: isEnrolled, isLoading: checkingEnrollment } = useQuery({
    ...convexQuery(api.students.isEnrolledWithTeacher, {
      teacherUserId,
    }),
    enabled: !!userId,
  });

  // Join teacher mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      return convex.mutation(api.students.joinTeacher, {
        teacherUserId,
      });
    },
    onSuccess: () => {
      clearPendingInvite();
      setJoinSuccess(true);
      queryClient.invalidateQueries({
        queryKey: ["convex", api.students.getMyTeachers],
      });
      queryClient.invalidateQueries({
        queryKey: ["convex", api.students.isEnrolledWithTeacher],
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
    },
  });

  // Handle unauthenticated users - store invite and redirect
  const handleSignUp = () => {
    storePendingInvite(teacherUserId);
    navigate({ to: "/signup" });
  };

  const handleLogin = () => {
    storePendingInvite(teacherUserId);
    navigate({ to: "/login" });
  };

  // If teacher not found
  if (!loaderData.teacherInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This teacher invite link is invalid. The teacher may not exist or
              the link is incorrect.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teacherName = loaderData.teacherInfo.name;

  // User is authenticated
  if (userId) {
    if (checkingEnrollment) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    // Already enrolled
    if (isEnrolled) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Already Enrolled!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You're already enrolled with <strong>{teacherName}</strong>.
              </p>
              <Button onClick={() => navigate({ to: "/" })} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show success message after joining
    if (joinSuccess) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Successfully Joined!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You've successfully joined <strong>{teacherName}</strong>'s
                classes. You can now access their documents.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show accept invite UI
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Classes</CardTitle>
            <CardDescription>
              <strong>{teacherName}</strong> invited you to join their classes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted p-4">
              <h3 className="mb-2 font-medium">What happens next?</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• You'll get access to documents from {teacherName}</li>
                <li>
                  • You can collaborate in real-time on language learning
                  exercises
                </li>
                <li>• View and complete assigned documents</li>
              </ul>
            </div>

            <Button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="w-full"
            >
              {joinMutation.isPending ? "Joining..." : "Accept Invite"}
            </Button>

            {joinMutation.isError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {joinMutation.error instanceof Error
                  ? joinMutation.error.message
                  : "Failed to accept invite. Please try again."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is not authenticated - show landing with signup/login options
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            <strong>{teacherName}</strong> invited you to join their classes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted p-4">
            <h3 className="mb-2 font-medium">What you'll get:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Access to interactive language documents</li>
              <li>• Real-time collaboration with your teacher</li>
              <li>• Track your learning progress</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={handleSignUp} className="w-full">
              Sign Up to Join
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={handleLogin}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Log in
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

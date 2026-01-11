import { api } from "@app/backend";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@package/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { clearPendingInvite, storePendingInvite } from "@/lib/invite-storage";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
});

function JoinPage() {
  const { token } = useParams({ from: "/join/$token" });
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [joinSuccess, setJoinSuccess] = useState(false);

  // Fetch invite details (no auth required for this query)
  const { data: invite, isLoading: inviteLoading } = useQuery(
    convexQuery(api.spaceInvites.getInviteByToken, { token }),
  );

  // Accept invite mutation
  const acceptInviteMutationFn = useConvexMutation(
    api.spaceInvites.acceptInvite,
  );
  const acceptInvite = useMutation({
    mutationFn: acceptInviteMutationFn,
    onSuccess: (result) => {
      clearPendingInvite();
      setJoinSuccess(true);

      setTimeout(() => {
        navigate({ to: "/spaces/$id", params: { id: result.spaceId } });
      }, 2000);
    },
  });

  // Handle unauthenticated users
  const handleSignUp = () => {
    storePendingInvite(token);
    navigate({ to: "/signup" });
  };

  const handleLogin = () => {
    storePendingInvite(token);
    navigate({ to: "/login" });
  };

  // Loading state
  if (inviteLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state (invalid/used/expired invite)
  if (invite?.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{invite.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success after joining
  if (joinSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto mb-4 size-12 text-green-600" />
            <CardTitle>You&apos;re In!</CardTitle>
            <CardDescription>
              You&apos;ve joined{" "}
              {invite && "valid" in invite ? (
                <>
                  <strong>{invite.teacherName}</strong>&apos;s{" "}
                  {invite.language} course.
                </>
              ) : (
                "the course."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your course...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite - show join UI
  if (invite && "valid" in invite && invite.valid) {
    const handleJoin = () => {
      acceptInvite.mutate({ token });
    };

    // User is authenticated
    if (user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Join {invite.language} Course</CardTitle>
              <CardDescription>
                <strong>{invite.teacherName}</strong> has invited you to join
                their {invite.language} course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Course details */}
              <div className="rounded-lg bg-muted p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="text-xl font-semibold">{invite.language}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Teacher</p>
                  <p className="font-medium">{invite.teacherName}</p>
                </div>
              </div>

              {/* What you'll get */}
              <div className="rounded-md border bg-muted/50 p-4">
                <h3 className="mb-2 font-medium">What happens next?</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    - You&apos;ll get access to lessons from {invite.teacherName}
                  </li>
                  <li>- You can collaborate on exercises in real-time</li>
                  <li>- Track your homework and progress</li>
                </ul>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={acceptInvite.isPending}
              >
                {acceptInvite.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Course"
                )}
              </Button>

              {acceptInvite.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {acceptInvite.error instanceof Error
                    ? acceptInvite.error.message
                    : "Failed to join course. Please try again."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // User is not authenticated - show signup/login options
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>You&apos;re Invited!</CardTitle>
            <CardDescription>
              <strong>{invite.teacherName}</strong> has invited you to join
              their {invite.language} course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course details */}
            <div className="rounded-lg bg-muted p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="text-xl font-semibold">{invite.language}</p>
                <p className="mt-2 text-sm text-muted-foreground">Teacher</p>
                <p className="font-medium">{invite.teacherName}</p>
              </div>
            </div>

            {/* What you'll get */}
            <div className="rounded-md border bg-muted/50 p-4">
              <h3 className="mb-2 font-medium">What you&apos;ll get:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>- Access to interactive language lessons</li>
                <li>- Real-time collaboration with your teacher</li>
                <li>- Track your learning progress</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button onClick={handleSignUp} className="w-full" size="lg">
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

  // Fallback
  return null;
}

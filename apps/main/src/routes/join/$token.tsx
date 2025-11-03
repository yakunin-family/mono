import { convexQuery, useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "@mono/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";

import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/join/$token")({
  component: JoinPage,
});

type FormValues = {
  name: string;
  email: string;
  password: string;
};

function JoinPage() {
  const { token } = useParams({ from: "/join/$token" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const convex = useConvex();
  const { userId } = Route.useRouteContext();
  const [globalError, setGlobalError] = useState("");

  // Fetch student info by invite token
  const { data: student, isLoading } = useQuery(
    convexQuery(api.students.getStudentByInviteToken, { token }),
  );

  // Link student to current user (for authenticated users)
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
      navigate({ to: "/" });
    },
  });

  // Student signup form (for unauthenticated users)
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as FormValues,
    onSubmit: async ({ value }) => {
      setGlobalError("");

      const { data, error } = await signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onError: (ctx) => {
            setGlobalError(ctx.error.message || "Failed to create account");
          },
        },
      );

      if (error) {
        setGlobalError(error.message || "Failed to create account");
        return;
      }

      // Create student profile
      await convex.mutation(api.userProfiles.createUserProfile, {
        userId: data.user.id,
        role: "student",
        displayName: value.name,
      });

      // Link to student record
      await convex.mutation(api.students.linkStudentToUser, {
        inviteToken: token,
      });

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

  // User is authenticated - show accept invite flow
  if (userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Student Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-muted-foreground">
                You've been invited to join the language learning platform as a
                student!
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

  // User is not authenticated - show student signup form
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Your Student Account</CardTitle>
            <CardDescription>
              You've been invited to join the language learning platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="grid gap-6">
                <div className="grid gap-6">
                  <form.Field
                    name="name"
                    validators={{
                      onBlur: ({ value }) => {
                        if (!value) return "Name is required";
                        if (value.length < 2)
                          return "Name must be at least 2 characters";
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="John Doe"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={form.state.isSubmitting}
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) => ({
                            message: e,
                          }))}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field
                    name="email"
                    validators={{
                      onBlur: ({ value }) => {
                        if (!value) return "Email is required";
                        if (!value.includes("@"))
                          return "Invalid email address";
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="m@example.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={form.state.isSubmitting}
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) => ({
                            message: e,
                          }))}
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field
                    name="password"
                    validators={{
                      onBlur: ({ value }) => {
                        if (!value) return "Password is required";
                        if (value.length < 8)
                          return "Password must be at least 8 characters";
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          disabled={form.state.isSubmitting}
                        />
                        <FieldDescription>
                          Must be at least 8 characters
                        </FieldDescription>
                        <FieldError
                          errors={field.state.meta.errors.map((e) => ({
                            message: e,
                          }))}
                        />
                      </Field>
                    )}
                  </form.Field>

                  {globalError && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {globalError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.state.isSubmitting}
                  >
                    {form.state.isSubmitting
                      ? "Creating account..."
                      : "Create account and join"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
          By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

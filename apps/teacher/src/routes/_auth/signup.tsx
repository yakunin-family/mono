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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useState } from "react";

import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
});

type FormValues = {
  name: string;
  email: string;
  password: string;
};

function SignupPage() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState("");
  const convex = useConvex();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as FormValues,
    onSubmit: async ({ value }) => {
      setGlobalError("");

      const { error } = await signUp.email(
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

      await convex.mutation(api.userProfiles.create, {
        role: "teacher",
      });

      navigate({ to: "/" });
    },
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          Acme Inc.
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create a Teacher Account</CardTitle>
            <CardDescription>
              Start creating lessons and inviting students
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
                      : "Create account"}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link to="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Are you a student? Ask your teacher for an invite link
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

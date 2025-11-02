import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldLabel,
  Input,
} from "@mono/ui";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/teacher/subscribe")({
  component: TeacherSubscribePage,
});

function TeacherSubscribePage() {
  const navigate = useNavigate();
  const convex = useConvex();

  const form = useForm({
    defaultValues: {
      displayName: "",
    },
    onSubmit: async ({ value }) => {
      await convex.mutation(api.userProfiles.activateTeacherRole, {
        displayName: value.displayName || undefined,
      });

      navigate({ to: "/" });
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Become a Teacher</CardTitle>
            <p className="text-sm text-muted-foreground">
              Start creating lessons and inviting students to your language
              learning platform
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Section - Placeholder */}
            <div className="rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-6">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-muted-foreground">during beta</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
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
                  Unlimited lessons
                </li>
                <li className="flex items-center gap-2">
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
                  Unlimited students
                </li>
                <li className="flex items-center gap-2">
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
                  Real-time collaboration
                </li>
                <li className="flex items-center gap-2">
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
                  Interactive exercises
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Payment integration coming soon. Enjoy full access during our
                beta period!
              </p>
            </div>

            {/* Setup Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="space-y-4">
                <form.Field name="displayName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Display Name (Optional)
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="How students will see your name"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={form.state.isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use your email address
                      </p>
                    </Field>
                  )}
                </form.Field>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate({ to: "/" })}
                    disabled={form.state.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.state.isSubmitting}>
                    {form.state.isSubmitting
                      ? "Activating..."
                      : "Activate Teacher Account"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

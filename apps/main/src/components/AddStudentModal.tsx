import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from "@mono/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
  const queryClient = useQueryClient();
  const convex = useConvex();

  const createStudentMutation = useMutation({
    mutationFn: async (nickname: string) => {
      return convex.mutation(api.students.createStudent, { nickname });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["convex", api.students.getMyStudents],
      });
      onClose();
    },
  });

  const form = useForm({
    defaultValues: {
      nickname: "",
    },
    onSubmit: async ({ value }) => {
      await createStudentMutation.mutateAsync(value.nickname);
    },
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="space-y-4">
                <form.Field
                  name="nickname"
                  validators={{
                    onBlur: ({ value }) => {
                      if (!value) return "Nickname is required";
                      if (value.length < 2)
                        return "Nickname must be at least 2 characters";
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Student Nickname
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder="e.g., John, Maria, Alex"
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={form.state.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.state.isSubmitting}>
                    {form.state.isSubmitting ? "Creating..." : "Create Student"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

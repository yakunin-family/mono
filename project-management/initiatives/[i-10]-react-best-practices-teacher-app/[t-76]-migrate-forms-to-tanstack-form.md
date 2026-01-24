---
status: todo
priority: medium
description: Migrate CreateInviteDialog and CreateLessonDialog to TanStack Form
tags: [forms, architecture]
---

# Migrate Forms to TanStack Form

Per CLAUDE.md guidelines, all forms must use TanStack Form. Currently `CreateInviteDialog.tsx` and other forms use controlled inputs with useState. Migrate to TanStack Form for built-in validation and type safety.

## Problem

Current implementation uses manual state management:

```typescript
// Current - manual controlled inputs
function CreateInviteDialog() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");

  const handleSubmit = () => {
    if (!email) {
      // Manual validation
    }
    // Submit
  };
}
```

Issues:

- Manual validation logic
- No type-safe form values
- Inconsistent patterns across forms
- Violates CLAUDE.md guidelines

## Solution

Migrate to TanStack Form:

```typescript
import { useForm } from "@tanstack/react-form";

function CreateInviteDialog() {
  const form = useForm({
    defaultValues: {
      email: "",
      role: "student" as const,
    },
    onSubmit: async ({ value }) => {
      await createInvite(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) =>
            !value ? "Email is required" : undefined,
        }}
      >
        {(field) => (
          <Input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
      {/* ... */}
    </form>
  );
}
```

## Forms to Migrate

### CreateInviteDialog

Location: `apps/teacher/src/spaces/space-detail/create-invite-dialog.tsx`

Fields:

- `email` (required, email validation)
- `role` (select: student | teacher)

### CreateLessonDialog

Location: `apps/teacher/src/spaces/space-detail/create-lesson-dialog.tsx`

Fields:

- `title` (required)
- `description` (optional)

### Other Forms (audit needed)

Check for other forms in the teacher app that need migration:

- Settings forms
- Profile forms
- Any other input dialogs

## Acceptance Criteria

- [ ] Migrate CreateInviteDialog to TanStack Form
- [ ] Migrate CreateLessonDialog to TanStack Form
- [ ] Add proper validation schemas (required fields, email format, etc.)
- [ ] Ensure type safety throughout
- [ ] Test form submission and validation
- [ ] Update any other forms found during audit

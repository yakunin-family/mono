import { useConvex } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { useMutation } from "@tanstack/react-query";

interface RoleSwitcherProps {
  currentRole: "teacher" | "student";
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const convex = useConvex();

  const updateLastUsedRoleMutation = useMutation({
    mutationFn: async (role: "teacher" | "student") => {
      return convex.mutation(api.userProfiles.updateLastUsedRole, { role });
    },
    onSuccess: () => {
      // Redirect to student app
      window.location.href = "http://localhost:3001";
    },
  });

  const handleSwitchToStudent = () => {
    updateLastUsedRoleMutation.mutate("student");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwitchToStudent}
      disabled={updateLastUsedRoleMutation.isPending}
    >
      {updateLastUsedRoleMutation.isPending
        ? "Switching..."
        : "Switch to Student View"}
    </Button>
  );
}

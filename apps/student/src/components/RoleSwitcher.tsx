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
      // Redirect to teacher app
      window.location.href = "http://localhost:3000";
    },
  });

  const handleSwitchToTeacher = () => {
    updateLastUsedRoleMutation.mutate("teacher");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSwitchToTeacher}
      disabled={updateLastUsedRoleMutation.isPending}
    >
      {updateLastUsedRoleMutation.isPending
        ? "Switching..."
        : "Switch to Teacher View"}
    </Button>
  );
}

import { Button } from "@mono/ui";
import { useState } from "react";

interface RoleSwitcherProps {
  currentRole: "teacher" | "student";
  availableRoles: {
    teacher: boolean;
    student: boolean;
  };
  onRoleChange: (role: "teacher" | "student") => void;
}

export function RoleSwitcher({
  currentRole,
  availableRoles,
  onRoleChange,
}: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If only one role is available, don't show switcher
  const roleCount =
    (availableRoles.teacher ? 1 : 0) + (availableRoles.student ? 1 : 0);
  if (roleCount <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="capitalize"
      >
        {currentRole} View
        <svg
          className="ml-2 size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border bg-popover p-1 shadow-lg">
            {availableRoles.teacher && currentRole !== "teacher" && (
              <button
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  onRoleChange("teacher");
                  setIsOpen(false);
                }}
              >
                Switch to Teacher View
              </button>
            )}
            {availableRoles.student && currentRole !== "student" && (
              <button
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => {
                  onRoleChange("student");
                  setIsOpen(false);
                }}
              >
                Switch to Student View
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

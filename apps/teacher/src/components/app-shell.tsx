import { cn, SidebarTrigger } from "@package/ui";
import { ComponentProps } from "react";

export const AppShell = ({ children }: { children?: React.ReactNode }) => {
  return children;
};

export const AppHeader = ({ children }: { children?: React.ReactNode }) => {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      {children}
    </header>
  );
};

export const AppContent = ({
  children,
  className,
  ...rest
}: ComponentProps<"main">) => {
  return (
    <main className={cn("overflow-auto p-6", className)} {...rest}>
      {children}
    </main>
  );
};

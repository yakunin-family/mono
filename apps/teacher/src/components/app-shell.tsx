import { cn, Separator, SidebarTrigger } from "@package/ui";
import { ComponentProps } from "react";

export const AppHeader = ({ children }: { children?: React.ReactNode }) => {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      {children}
    </header>
  );
};

export const AppContent = ({ children, className, ...rest }: ComponentProps<"main">) => {
  return (
    <main className={cn("flex-1 overflow-auto p-6", className)} {...rest}>
      {children}
    </main>
  );
};

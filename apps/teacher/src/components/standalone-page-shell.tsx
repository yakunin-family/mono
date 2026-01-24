import { Button, cn } from "@package/ui";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export function StandalonePageShell({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn("flex h-svh w-full bg-sidebar", className)} {...props}>
      <main className="bg-background relative flex w-full flex-1 flex-col overflow-hidden m-2 rounded-xl shadow-sm">
        {children}
      </main>
    </div>
  );
}

interface StandalonePageHeaderProps extends ComponentProps<"header"> {
  backTo?: LinkProps["to"];
  backParams?: LinkProps["params"];
  actions?: ReactNode;
}

export function StandalonePageHeader({
  children,
  className,
  backTo,
  backParams,
  actions,
  ...props
}: StandalonePageHeaderProps) {
  return (
    <header
      className={cn("flex h-14 items-center gap-2 border-b px-4", className)}
      {...props}
    >
      {backTo && (
        <Link to={backTo} params={backParams}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
      )}
      <div className="flex flex-1 items-center gap-2">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StandalonePageContent({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-1 flex-col overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

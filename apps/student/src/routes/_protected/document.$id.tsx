import { api } from "@mono/backend";
import { DocumentEditor } from "@mono/editor";
import { Button } from "@mono/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";

import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/document/$id")({
  component: DocumentViewerPage,
});

function DocumentViewerPage() {
  const navigate = useNavigate();
  const { id: documentId } = Route.useParams();
  const { token } = Route.useRouteContext();
  const convex = useConvex();

  // Fetch document
  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      return await convex.query(api.documents.getDocument, {
        documentId,
      });
    },
  });

  if (documentQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (documentQuery.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading document. You may not have access to this document.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeftIcon className="size-4" />
            </Button>

            <h1 className="text-xl font-bold">{documentQuery.data?.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl">
          <DocumentEditor
            documentId={documentId}
            canEdit={true}
            token={token}
            websocketUrl={
              process.env.NODE_ENV === "development"
                ? "ws://127.0.0.1:1234"
                : "wss://collab.untitled.nikita-yakunin.dev"
            }
          />
        </div>
      </main>
    </div>
  );
}

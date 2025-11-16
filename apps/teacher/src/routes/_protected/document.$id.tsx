import { api } from "@mono/backend";
import { DocumentEditor, getRandomUserColor } from "@mono/editor";
import { Button } from "@mono/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { signOut, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/document/$id")({
  component: DocumentEditorPage,
});

function DocumentEditorPage() {
  const navigate = useNavigate();
  const { id: documentId } = Route.useParams();
  const { token } = Route.useRouteContext();
  const convex = useConvex();
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { data: session } = useSession();

  // Generate a stable random color for this user
  const userColor = useMemo(() => getRandomUserColor(), []);

  // Get user name from session, fallback to email or "Anonymous"
  const userName = session?.user?.name || session?.user?.email || "Anonymous";

  // Fetch document
  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const doc = await convex.query(api.documents.getDocument, {
        documentId,
      });
      setTitle(doc.title);
      return doc;
    },
  });

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      await convex.mutation(api.documents.updateDocumentTitle, {
        documentId,
        title: newTitle,
      });
    },
    onSuccess: () => {
      setIsEditingTitle(false);
      documentQuery.refetch();
    },
  });

  const handleTitleSave = () => {
    if (title.trim() && title !== documentQuery.data?.title) {
      updateTitleMutation.mutate(title);
    } else {
      setIsEditingTitle(false);
    }
  };

  // Handle AI generation creation
  const handleCreateGeneration = async (
    promptText: string,
    model: string,
  ): Promise<{ generationId: string; streamId: string }> => {
    const result = await convex.mutation(api.ai.createGeneration, {
      documentId,
      promptText,
      model,
    });

    return result;
  };

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
          <p className="text-red-600 mb-4">Error loading document</p>
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

            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSave();
                  } else if (e.key === "Escape") {
                    setTitle(documentQuery.data?.title || "");
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xl font-bold border-b-2 border-primary bg-transparent outline-none px-2 py-1"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-bold cursor-pointer hover:text-muted-foreground transition-colors px-2 py-1"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {documentQuery.data?.title}
              </h1>
            )}
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
            userName={userName}
            userColor={userColor}
            websocketUrl={
              process.env.NODE_ENV === "development"
                ? "ws://127.0.0.1:1234"
                : "wss://collab.untitled.nikita-yakunin.dev"
            }
            convexClient={convex}
            onCreateGeneration={handleCreateGeneration}
          />
        </div>
      </main>
    </div>
  );
}

import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

const createLink = (userId: string) => {
  if (process.env.NODE_ENV === "development") {
    return `http://localhost:3001/join/${userId}`;
  }

  return `https://student.untitled.nikita-yakunin.dev/join/${userId}`;
};

function DashboardPage() {
  const navigate = useNavigate();
  const { userId } = Route.useRouteContext();
  const [copySuccess, setCopySuccess] = useState(false);
  const convex = useConvex();

  const inviteLink = createLink(userId);

  // Fetch documents
  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      return await convex.query(api.documents.getMyDocuments, {});
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async () => {
      const documentId = await convex.mutation(api.documents.createDocument, {
        title: "Untitled Document",
      });
      return documentId;
    },
    onSuccess: (documentId) => {
      navigate({ to: "/document/$id", params: { id: documentId } });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            Language Learning Platform - Teacher
          </h1>
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
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Documents Section */}
          <div className="rounded-lg border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Documents</h2>
              <Button
                onClick={() => createDocumentMutation.mutate()}
                disabled={createDocumentMutation.isPending}
                size="sm"
              >
                <PlusIcon className="mr-2 size-4" />
                {createDocumentMutation.isPending
                  ? "Creating..."
                  : "New Document"}
              </Button>
            </div>

            {documentsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading documents...
              </p>
            ) : documentsQuery.error ? (
              <p className="text-sm text-red-600">Error loading documents</p>
            ) : documentsQuery.data && documentsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {documentsQuery.data.map((doc) => (
                  <Link
                    key={doc._id}
                    to="/document/$id"
                    params={{ id: doc._id }}
                    className="block rounded border p-4 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <FileTextIcon className="size-5 text-muted-foreground" />
                      <div className="flex-1">
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Last updated:{" "}
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileTextIcon className="mx-auto mb-2 size-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No documents yet. Create your first document to get started!
                </p>
              </div>
            )}
          </div>

          {/* Invite Students Section */}
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Invite Students to Join Your Classes
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Share this permanent link with your students. They can use it
              anytime to join your classes.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded border bg-muted px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
              >
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

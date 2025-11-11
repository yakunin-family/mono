import { convexQuery } from "@convex-dev/react-query";
import { api } from "@mono/backend";
import { Button } from "@mono/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileTextIcon } from "lucide-react";

import { RoleSwitcher } from "@/components/RoleSwitcher";
import { signOut } from "@/lib/auth-client";
import { useUser } from "@/providers/user";

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  // Fetch enrolled teachers
  const { data: teachers, isLoading } = useQuery(
    convexQuery(api.students.getMyTeachers, {}),
  );

  // Fetch shared documents
  const { data: sharedDocuments, isLoading: isLoadingDocuments } = useQuery(
    convexQuery(api.documents.getSharedDocuments, {}),
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">
            Language Learning Platform - Student
          </h1>
          <div className="flex items-center gap-4">
            {user.roles.includes("teacher") && (
              <RoleSwitcher currentRole="student" />
            )}
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
          {/* Shared Documents Section */}
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Shared Documents</h2>

            {isLoadingDocuments ? (
              <p className="text-sm text-muted-foreground">
                Loading documents...
              </p>
            ) : sharedDocuments && sharedDocuments.length > 0 ? (
              <div className="space-y-2">
                {sharedDocuments.map((doc) => (
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
                          Shared by {doc.teacherName} •{" "}
                          {new Date(doc.sharedAt).toLocaleDateString()}
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
                  No documents shared with you yet.
                </p>
              </div>
            )}
          </div>

          {/* My Teachers Section */}
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">My Teachers</h2>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : teachers && teachers.length > 0 ? (
              <div className="space-y-3">
                {teachers.map((enrollment) => (
                  <div
                    key={enrollment.teacherId}
                    className="flex items-center justify-between rounded-md border bg-muted p-4"
                  >
                    <div>
                      <p className="font-medium">{enrollment.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined{" "}
                        {new Date(enrollment.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  You haven&apos;t joined any teachers yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Ask your teacher for an invite link to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

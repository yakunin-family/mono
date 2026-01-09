import { api } from "@app/backend";
import { Button } from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useState } from "react";
import {
  ArrowLeftIcon,
  FileTextIcon,
  LayoutTemplateIcon,
  ListIcon,
  TrashIcon,
} from "lucide-react";

export const Route = createFileRoute("/_protected/library")({
  component: LibraryPage,
});

type LibraryItemType = "exercise" | "section" | "template";
type FilterType = "all" | LibraryItemType;

const typeBadgeColors: Record<LibraryItemType, string> = {
  exercise: "bg-blue-100 text-blue-800",
  section: "bg-green-100 text-green-800",
  template: "bg-purple-100 text-purple-800",
};

const typeIcons: Record<LibraryItemType, React.ReactNode> = {
  exercise: <FileTextIcon className="size-5 text-muted-foreground" />,
  section: <ListIcon className="size-5 text-muted-foreground" />,
  template: <LayoutTemplateIcon className="size-5 text-muted-foreground" />,
};

function LibraryPage() {
  const convex = useConvex();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const libraryQuery = useQuery({
    queryKey: ["library", typeFilter],
    queryFn: async () => {
      return await convex.query(api.exerciseBank.getMyItems, {
        type: typeFilter === "all" ? undefined : typeFilter,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await convex.mutation(api.exerciseBank.deleteItem, {
        itemId: itemId as never,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Library</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="rounded border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Items</option>
              <option value="exercise">Exercises</option>
              <option value="section">Sections</option>
              <option value="template">Templates</option>
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-background p-6">
            {libraryQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : libraryQuery.error ? (
              <p className="text-sm text-red-600">Error loading items</p>
            ) : libraryQuery.data && libraryQuery.data.length > 0 ? (
              <div className="space-y-2">
                {libraryQuery.data.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 rounded border p-4 hover:bg-muted"
                  >
                    {typeIcons[item.type]}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.title}</h3>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${typeBadgeColors[item.type]}`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Saved: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item._id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileTextIcon className="mx-auto mb-2 size-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  {typeFilter === "all"
                    ? "No saved items yet. Save exercises, sections, or templates from documents to build your library."
                    : `No saved ${typeFilter}s yet.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

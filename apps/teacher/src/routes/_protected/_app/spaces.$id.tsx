import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useConvex } from "convex/react";
import {
  BookOpenIcon,
  ClipboardListIcon,
  Ellipsis,
  EllipsisIcon,
  Loader2Icon,
  PlusIcon,
  Trash2,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AppContent, AppHeader, AppShell } from "@/components/app-shell";

interface LessonWithHomework {
  _id: Id<"document">;
  _creationTime: number;
  spaceId?: Id<"spaces">;
  lessonNumber?: number;
  owner?: string;
  title: string;
  content?: ArrayBuffer;
  createdAt: number;
  updatedAt: number;
  homeworkCount: number;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const Route = createFileRoute("/_protected/_app/spaces/$id")({
  loader: async ({ params, context }) => {
    const { id: spaceId } = params;

    try {
      const space = await context.queryClient.ensureQueryData(
        convexQuery(api.spaces.getSpace, {
          spaceId: spaceId as Id<"spaces">,
        }),
      );

      if (!space) {
        throw notFound();
      }

      return { space };
    } catch {
      throw notFound();
    }
  },
  component: SpaceDetailPage,
});

function SpaceDetailPage() {
  const { space } = Route.useLoaderData();

  return (
    <AppShell>
      <AppHeader>
        <div className="flex justify-between w-full items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Students</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="gap-2 flex">
                  <span>{space.studentName}</span>
                  <Badge variant="secondary">{space.language}</Badge>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button size="icon-sm" variant="ghost">
                    <Ellipsis />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AppHeader>
      <AppContent>
        <SpaceDetailPageContent />
      </AppContent>
    </AppShell>
  );
}

function SpaceDetailPageContent() {
  const { id: spaceId } = Route.useParams();
  const { space: spaceLoaderData } = Route.useLoaderData();
  const navigate = useNavigate();
  const convex = useConvex();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const spaceQuery = useQuery({
    ...convexQuery(api.spaces.getSpace, {
      spaceId: spaceId as Id<"spaces">,
    }),
  });

  const lessonsQuery = useQuery({
    ...convexQuery(api.documents.getSpaceLessonsWithHomeworkCounts, {
      spaceId: spaceId as Id<"spaces">,
    }),
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async () => {
      await convex.mutation(api.spaces.deleteSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      navigate({ to: "/" });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (documentId: Id<"document">) => {
      await convex.mutation(api.documents.deleteLesson, { documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.documents.getSpaceLessonsWithHomeworkCounts, {
          spaceId: spaceId as Id<"spaces">,
        }).queryKey,
      });
      setDeletingLessonId(null);
    },
  });

  const columnHelper = createColumnHelper<LessonWithHomework>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Name",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {info.row.original.lessonNumber ?? "?"}
            </span>
            <span className="font-medium">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("updatedAt", {
        header: "Updated",
        cell: (info) => (
          <span className="text-muted-foreground">
            {formatDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("homeworkCount", {
        header: () => null,
        cell: (info) => {
          const count = info.getValue();
          if (count === 0) return null;
          return (
            <div className="flex items-center gap-1 text-muted-foreground">
              <ClipboardListIcon className="size-4" />
              <span className="text-sm">{count}</span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex justify-end opacity-0 transition-opacity group-hover/row:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingLessonId(row.original._id);
                  }}
                >
                  <Trash2Icon className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: (lessonsQuery.data ?? []) as LessonWithHomework[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const space = spaceQuery.data ?? spaceLoaderData;

  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <div className="space-y-6">
          {/* Lessons Section */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lessons</h2>
            <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
              <Button size="sm">
                <PlusIcon className="size-4" />
                New Lesson
              </Button>
            </Link>
          </div>

          {lessonsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (lessonsQuery.data?.length ?? 0) === 0 ? (
            <div className="py-8 text-center">
              <BookOpenIcon className="mx-auto mb-3 size-12 text-muted-foreground opacity-50" />
              <p className="mb-4 text-sm text-muted-foreground">
                No lessons yet. Create your first lesson to get started.
              </p>
              <Link to="/spaces/$id/new-lesson" params={{ id: spaceId }}>
                <Button>
                  <PlusIcon className="size-4" />
                  Create First Lesson
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group/row cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: "/spaces/$id/lesson/$lessonId",
                          params: { id: spaceId, lessonId: row.original._id },
                        })
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Space Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this space?</DialogTitle>
            <DialogDescription>
              This will permanently delete all lessons and homework for{" "}
              {space.studentName}&apos;s {space.language} course. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSpaceMutation.mutate()}
              disabled={deleteSpaceMutation.isPending}
            >
              {deleteSpaceMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Confirmation Dialog */}
      <Dialog
        open={!!deletingLessonId}
        onOpenChange={(open) => !open && setDeletingLessonId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this lesson?</DialogTitle>
            <DialogDescription>
              This will permanently delete this lesson and all associated
              homework. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLessonId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingLessonId) {
                  deleteLessonMutation.mutate(
                    deletingLessonId as Id<"document">,
                  );
                }
              }}
              disabled={deleteLessonMutation.isPending}
            >
              {deleteLessonMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

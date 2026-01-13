import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  DocumentEditor,
  type DocumentEditorHandle,
  getRandomUserColor,
  LibraryMetadata,
  SaveToLibraryData,
  SaveToLibraryDrawer,
} from "@package/editor";
import {
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import {
  ArrowLeftIcon,
  CopyIcon,
  FileTextIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/auth-client";

export const Route = createFileRoute(
  "/_protected/spaces/$id_/lesson/$lessonId",
)({
  component: LessonEditorPage,
});

function LessonEditorPage() {
  const navigate = useNavigate();
  const { id: spaceId, lessonId } = Route.useParams();
  const { accessToken, user } = Route.useRouteContext();
  const convex = useConvex();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const editorRef = useRef<DocumentEditorHandle | null>(null);

  const [title, setTitle] = useState("");
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);

  const userColor = useMemo(() => getRandomUserColor(), []);
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "Anonymous";

  const lessonQuery = useQuery({
    ...convexQuery(api.documents.getLesson, {
      documentId: lessonId as Id<"document">,
    }),
  });

  const spaceQuery = useQuery({
    queryKey: ["space", spaceId],
    queryFn: async () => {
      return await convex.query(api.spaces.getSpace, {
        spaceId: spaceId as Id<"spaces">,
      });
    },
    enabled: !!lessonQuery.data,
  });

  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      return await convex.query(api.exerciseBank.getMyItems, {});
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      await convex.mutation(api.documents.updateLesson, {
        documentId: lessonId as Id<"document">,
        title: newTitle,
      });
    },
    onSuccess: () => {
      setIsTitleDirty(false);
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.documents.getLesson, {
          documentId: lessonId as Id<"document">,
        }).queryKey,
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async () => {
      await convex.mutation(api.documents.deleteLesson, {
        documentId: lessonId as Id<"document">,
      });
    },
    onSuccess: () => {
      navigate({ to: "/spaces/$id", params: { id: spaceId } });
    },
  });

  const duplicateLessonMutation = useMutation({
    mutationFn: async () => {
      return await convex.mutation(api.documents.duplicateLesson, {
        documentId: lessonId as Id<"document">,
      });
    },
    onSuccess: (result) => {
      navigate({
        to: "/spaces/$id/lesson/$lessonId",
        params: { id: spaceId, lessonId: result.lessonId },
      });
    },
  });

  const saveExerciseMutation = useMutation({
    mutationFn: async ({
      title,
      content,
    }: {
      title: string;
      content: string;
    }) => {
      await convex.mutation(api.exerciseBank.saveExercise, { title, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  const saveGroupMutation = useMutation({
    mutationFn: async ({
      title,
      content,
    }: {
      title: string;
      content: string;
    }) => {
      await convex.mutation(api.exerciseBank.saveItem, {
        title,
        content,
        type: "group",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      description,
      metadata,
    }: {
      title: string;
      content: string;
      description?: string;
      metadata?: SaveToLibraryData["metadata"];
    }) => {
      await convex.mutation(api.exerciseBank.saveItemWithMetadata, {
        title,
        content,
        type: "template",
        description,
        metadata: metadata
          ? {
              language: metadata.language,
              levels: metadata.levels,
              topic: metadata.topic,
              tags: metadata.tags,
              autoTagged: metadata.autoTagged,
            }
          : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      setSaveTemplateModalOpen(false);
    },
  });

  const autoTagMutation = useMutation({
    mutationFn: async (content: string) => {
      return await convex.action(api.exerciseBank.autoTagContent, { content });
    },
  });

  useEffect(() => {
    if (lessonQuery.data && !isTitleDirty) {
      setTitle(lessonQuery.data.title);
    }
  }, [lessonQuery.data, isTitleDirty]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsTitleDirty(true);
  };

  const handleTitleSave = () => {
    if (isTitleDirty && title !== lessonQuery.data?.title) {
      updateLessonMutation.mutate(title);
    }
  };

  const handleStartExerciseGeneration = async (
    promptText: string,
    model: string,
  ): Promise<{ sessionId: string }> => {
    const result = await convex.mutation(
      api.exerciseGeneration.startExerciseGeneration,
      {
        documentId: lessonId as Id<"document">,
        promptText,
        model,
      },
    );
    return { sessionId: result.sessionId };
  };

  const handleSaveExerciseToBank = async (title: string, content: string) => {
    await saveExerciseMutation.mutateAsync({ title, content });
  };

  const handleSaveGroupToLibrary = async (title: string, content: string) => {
    await saveGroupMutation.mutateAsync({ title, content });
  };

  const getTemplateContent = useCallback(() => {
    const json = editorRef.current?.getJSON();
    return json ? JSON.stringify(json) : "";
  }, []);

  const handleSaveAsTemplate = (data: SaveToLibraryData) => {
    const content = getTemplateContent();
    if (content) {
      saveTemplateMutation.mutate({
        title: data.title,
        content,
        description: data.description,
        metadata: data.metadata,
      });
    }
  };

  if (lessonQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lessonQuery.data) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b bg-background">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>
            <span className="text-muted-foreground">Lesson not found</span>
          </div>
        </header>
        <main className="flex-1 bg-muted p-6">
          <div className="mx-auto max-w-4xl py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              This lesson does not exist or you do not have access to it.
            </p>
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button>Back to Space</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const lesson = lessonQuery.data;
  const space = spaceQuery.data;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button variant="ghost" size="icon-sm">
                <ArrowLeftIcon className="size-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                Lesson #{lesson.lessonNumber}
              </span>
              <span className="text-muted-foreground">-</span>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="h-auto border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
                style={{ width: `${Math.max(title.length, 10)}ch` }}
              />
              {isTitleDirty && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleTitleSave}
                  disabled={updateLessonMutation.isPending}
                >
                  {updateLessonMutation.isPending ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SaveIcon className="size-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSaveTemplateModalOpen(true)}
                >
                  <FileTextIcon className="size-4" />
                  Save as Template
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => duplicateLessonMutation.mutate()}
                  disabled={duplicateLessonMutation.isPending}
                >
                  <CopyIcon className="size-4" />
                  Duplicate Lesson
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2Icon className="size-4" />
                  Delete Lesson
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ returnTo: "/login" })}
            >
              Logout
            </Button>
          </div>
        </div>

        {space && (
          <div className="border-t px-6 py-2">
            <p className="text-sm text-muted-foreground">
              {space.studentName} - {space.language}
            </p>
          </div>
        )}
      </header>

      <main className="flex-1 bg-background">
        <DocumentEditor
          documentId={lessonId}
          spaceId={spaceId}
          canEdit={true}
          mode="teacher-editor"
          token={accessToken ?? undefined}
          userName={userName}
          userColor={userColor}
          websocketUrl={
            process.env.NODE_ENV === "development"
              ? "ws://127.0.0.1:1234"
              : "wss://collab.untitled.nikita-yakunin.dev"
          }
          convexClient={convex}
          queryClient={queryClient}
          onStartExerciseGeneration={handleStartExerciseGeneration}
          onSaveExerciseToBank={handleSaveExerciseToBank}
          onSaveGroupToLibrary={handleSaveGroupToLibrary}
          libraryItems={libraryQuery.data}
          isLoadingLibraryItems={libraryQuery.isLoading}
          editorRef={editorRef}
        />

        <SaveToLibraryDrawer
          open={saveTemplateModalOpen}
          onOpenChange={setSaveTemplateModalOpen}
          type="template"
          contentForTagging={getTemplateContent()}
          onSave={handleSaveAsTemplate}
          onAutoTag={async (content) => {
            const result = await autoTagMutation.mutateAsync(content);
            return {
              language: result.language,
              levels: result.levels as LibraryMetadata["levels"],
              topic: result.topic,
              tags: result.tags,
              autoTagged: result.autoTagged,
            };
          }}
          isSaving={saveTemplateMutation.isPending}
        />
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this lesson?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;Lesson #{lesson.lessonNumber} -{" "}
              {lesson.title}&quot; and all associated homework. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteLessonMutation.mutate()}
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

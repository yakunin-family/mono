import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
import {
  DocumentEditor,
  type DocumentEditorHandle,
  getRandomUserColor,
  SaveToLibraryData,
  SaveToLibraryDrawer,
} from "@package/editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  cn,
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
  CopyIcon,
  FileTextIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  StandalonePageContent,
  StandalonePageHeader,
  StandalonePageShell,
} from "@/components/standalone-page-shell";
import { useSession } from "@/lib/auth-client";
import { ChatErrorBoundary } from "@/spaces/document-editor/chat-error-boundary";
import { ChatInput } from "@/spaces/document-editor/chat-input";
import { ChatMessages } from "@/spaces/document-editor/chat-messages";
import {
  ChatSidebar,
  ChatSidebarTrigger,
} from "@/spaces/document-editor/chat-sidebar";
import type { ThreadInfo } from "@/spaces/document-editor/thread-selector";
import { useChat } from "@/spaces/document-editor/use-chat";
import { useImageUpload } from "@/spaces/document-editor/use-image-upload";

export const Route = createFileRoute(
  "/_protected/spaces/$id_/lesson/$lessonId",
)({
  component: LessonEditorPage,
});

function LessonEditorPage() {
  const navigate = useNavigate();
  const { id: spaceId, lessonId } = Route.useParams();
  const { token } = Route.useRouteContext();
  const { data: session } = useSession();
  const convex = useConvex();
  const queryClient = useQueryClient();
  const editorRef = useRef<DocumentEditorHandle | null>(null);

  const [title, setTitle] = useState("");
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("chat-sidebar-open") === "true";
    }
    return false;
  });

  // Track active thread - null means "new conversation" mode
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Track editor readiness - we need state because ref updates don't trigger re-renders
  const [editorReady, setEditorReady] = useState(false);
  const editor = editorReady ? (editorRef.current?.getEditor() ?? null) : null;

  // Check for editor availability periodically until it's ready
  useEffect(() => {
    if (editorReady) return;

    const checkEditor = () => {
      if (editorRef.current?.getEditor()) {
        setEditorReady(true);
      }
    };

    // Check immediately and then periodically
    checkEditor();
    const interval = setInterval(checkEditor, 100);

    return () => clearInterval(interval);
  }, [editorReady]);

  // Query threads for this document
  const { data: threadsData } = useQuery({
    ...convexQuery(api.chat.listThreadsForDocument, {
      documentId: lessonId as Id<"document">,
    }),
    enabled: !!lessonId,
  });

  // Transform to ThreadInfo format
  const threads: ThreadInfo[] = useMemo(
    () =>
      (threadsData ?? []).map((t) => ({
        threadId: t.threadId,
        documentId: t.documentId,
        createdAt: t.createdAt,
        preview: t.preview,
        messageCount: t.messageCount,
      })),
    [threadsData],
  );

  // Delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      await convex.mutation(api.chat.deleteThread, { threadId });
    },
    onSuccess: (_, deletedThreadId) => {
      // If we deleted the active thread, switch to new conversation
      if (activeThreadId === deletedThreadId) {
        setActiveThreadId(null);
      }
    },
  });

  // Chat with AI backend
  const {
    messages: chatMessages,
    operationResults,
    editResults,
    isLoading: isChatLoading,
    sendMessage,
    sendFirstMessage,
    cancelGeneration,
  } = useChat({
    documentId: lessonId,
    editor,
    threadId: activeThreadId,
  });

  // Image upload handler
  const { uploadImage } = useImageUpload();

  // Handle sending message - creates thread if needed
  const handleSendMessage = useCallback(
    async (
      content: string,
      attachments?: { fileId: string; filename: string; mimeType: string }[],
    ) => {
      if (activeThreadId) {
        // Send to existing thread
        sendMessage(content, attachments);
      } else {
        // Create new thread and send first message
        const newThreadId = await sendFirstMessage(content, attachments);
        setActiveThreadId(newThreadId);
      }
    },
    [activeThreadId, sendMessage, sendFirstMessage],
  );

  // Thread management handlers
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      deleteThreadMutation.mutate(threadId);
    },
    [deleteThreadMutation],
  );

  // Persist chat sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem("chat-sidebar-open", String(chatSidebarOpen));
  }, [chatSidebarOpen]);

  // Handle image upload events from editor
  useEffect(() => {
    const handleUploadImage = async (e: Event) => {
      const event = e as CustomEvent<{
        file: File;
        editor: {
          commands: {
            insertImage: (attrs: {
              storageId: string;
              caption: string | null;
              alt: string;
            }) => void;
          };
        };
        range: number | null;
      }>;
      const { file, editor: editorFromEvent } = event.detail;

      try {
        const { storageId, alt } = await uploadImage(file);
        editorFromEvent.commands.insertImage({ storageId, caption: null, alt });
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    };

    window.addEventListener("uploadImage", handleUploadImage);
    return () => window.removeEventListener("uploadImage", handleUploadImage);
  }, [uploadImage]);

  const userColor = useMemo(() => getRandomUserColor(), []);
  const userName = session?.user?.name || session?.user?.email || "Anonymous";

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
      return await convex.query(api.library.getMyItems, {});
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
      await convex.mutation(api.library.saveExercise, { title, content });
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
      await convex.mutation(api.library.saveItem, {
        title,
        content,
        type: "group",
      });
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
      await convex.mutation(api.library.saveItemWithMetadata, {
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
            }
          : undefined,
      });
    },
    onSuccess: () => {
      setSaveTemplateModalOpen(false);
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
      <StandalonePageShell>
        <StandalonePageHeader backTo="/spaces/$id" backParams={{ id: spaceId }}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">Loading...</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </StandalonePageHeader>
        <StandalonePageContent className="flex items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </StandalonePageContent>
      </StandalonePageShell>
    );
  }

  if (!lessonQuery.data) {
    return (
      <StandalonePageShell>
        <StandalonePageHeader backTo="/spaces/$id" backParams={{ id: spaceId }}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">Lesson not found</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </StandalonePageHeader>
        <StandalonePageContent className="flex items-center justify-center p-6">
          <div className="mx-auto max-w-4xl py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              This lesson does not exist or you do not have access to it.
            </p>
            <Link to="/spaces/$id" params={{ id: spaceId }}>
              <Button>Back to Space</Button>
            </Link>
          </div>
        </StandalonePageContent>
      </StandalonePageShell>
    );
  }

  const lesson = lessonQuery.data;
  const space = spaceQuery.data;

  const toggleChatSidebar = () => setChatSidebarOpen((prev) => !prev);

  const headerActions = (
    <>
      <ChatSidebarTrigger onClick={toggleChatSidebar} />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setSaveTemplateModalOpen(true)}>
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
    </>
  );

  return (
    <div className="flex h-svh w-full">
      <StandalonePageShell>
        <StandalonePageHeader
          backTo="/spaces/$id"
          backParams={{ id: spaceId }}
          actions={headerActions}
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>
                  Students
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to="/spaces/$id" params={{ id: spaceId }} />}
                >
                  {space?.studentName ?? "..."}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1">
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    className="h-auto border-none bg-transparent p-0 font-normal focus-visible:ring-0"
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
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </StandalonePageHeader>

        <StandalonePageContent className="relative flex-row">
          {/* Editor takes remaining space */}
          <div className="flex min-w-0 flex-1 flex-col">
            <DocumentEditor
              documentId={lessonId}
              spaceId={spaceId}
              canEdit={true}
              mode="teacher-editor"
              token={token ?? undefined}
              userName={userName}
              userColor={userColor}
              websocketUrl={
                process.env.NODE_ENV === "development"
                  ? "ws://127.0.0.1:1234"
                  : "wss://collab.untitled.nikita-yakunin.dev"
              }
              convexClient={convex}
              queryClient={queryClient}
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
              onSave={handleSaveAsTemplate}
              isSaving={saveTemplateMutation.isPending}
            />
          </div>
        </StandalonePageContent>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this lesson?</DialogTitle>
              <DialogDescription>
                This will permanently delete &quot;{lesson.title}&quot; and all
                associated homework. This action cannot be undone.
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
      </StandalonePageShell>
      <StandalonePageShell
        className={cn("overflow-hidden transition-all [&>main]:ml-0", {
          "w-[560px]": chatSidebarOpen,
          "w-0": !chatSidebarOpen,
        })}
      >
        <ChatSidebar
          onToggle={toggleChatSidebar}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          isLoadingThreads={threadsData === undefined}
        >
          <ChatErrorBoundary>
            <div className="relative flex-1 overflow-hidden">
              <ChatMessages
                messages={chatMessages}
                operationResults={operationResults}
                editResults={editResults}
                isLoading={isChatLoading}
              />
            </div>
            <ChatInput
              onSend={handleSendMessage}
              onCancel={cancelGeneration}
              isLoading={isChatLoading}
            />
          </ChatErrorBoundary>
        </ChatSidebar>
      </StandalonePageShell>
    </div>
  );
}

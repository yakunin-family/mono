import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@app/backend";

const TEMPLATE_CONTENT_KEY = "pending-template-content";
import {
  DocumentEditor,
  type DocumentEditorHandle,
  type EditorMode,
  getRandomUserColor,
  SaveToLibraryModal,
} from "@package/editor";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { ArrowLeftIcon, ChevronDownIcon, FileTextIcon } from "lucide-react";

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
  const [editorMode, setEditorMode] = useState<EditorMode>("teacher-editor");
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const editorRef = useRef<DocumentEditorHandle | null>(null);
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const templateInjectedRef = useRef(false);

  // Generate a stable random color for this user
  const userColor = useMemo(() => getRandomUserColor(), []);

  // Inject template content if pending (from creating document from template)
  const injectTemplateContent = useCallback(() => {
    if (templateInjectedRef.current) return;

    const pendingContent = sessionStorage.getItem(TEMPLATE_CONTENT_KEY);
    if (pendingContent) {
      const editor = editorRef.current?.getEditor();
      if (editor) {
        try {
          const content = JSON.parse(pendingContent);
          editor.commands.setContent(content);
          sessionStorage.removeItem(TEMPLATE_CONTENT_KEY);
          templateInjectedRef.current = true;
        } catch (e) {
          console.error("Failed to parse template content:", e);
          sessionStorage.removeItem(TEMPLATE_CONTENT_KEY);
        }
      }
    }
  }, []);

  // Poll for editor readiness to inject template content
  useEffect(() => {
    const pendingContent = sessionStorage.getItem(TEMPLATE_CONTENT_KEY);
    if (!pendingContent || templateInjectedRef.current) return;

    const checkInterval = setInterval(() => {
      const editor = editorRef.current?.getEditor();
      if (editor && !editor.isDestroyed) {
        injectTemplateContent();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [injectTemplateContent]);

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

  // Handle exercise generation creation
  const handleStartExerciseGeneration = async (
    promptText: string,
    model: string,
  ): Promise<{ sessionId: string }> => {
    const result = await convex.mutation(
      api.exerciseGeneration.startExerciseGeneration,
      {
        documentId,
        promptText,
        model,
      },
    );

    return { sessionId: result.sessionId };
  };

  // Fetch library items (exercises and sections)
  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      return await convex.query(api.exerciseBank.getMyItems, {});
    },
  });

  // Save exercise to bank mutation
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

  const handleSaveExerciseToBank = async (title: string, content: string) => {
    await saveExerciseMutation.mutateAsync({ title, content });
  };

  // Save group mutation
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

  const handleSaveGroupToLibrary = async (title: string, content: string) => {
    await saveGroupMutation.mutateAsync({ title, content });
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      description,
    }: {
      title: string;
      content: string;
      description?: string;
    }) => {
      await convex.mutation(api.exerciseBank.saveItem, {
        title,
        content,
        type: "template",
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      setSaveTemplateModalOpen(false);
    },
  });

  const handleSaveAsTemplate = (title: string, description?: string) => {
    const json = editorRef.current?.getJSON();
    if (json) {
      saveTemplateMutation.mutate({
        title,
        content: JSON.stringify(json),
        description,
      });
    }
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1 text-xl font-bold hover:text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
                    title="Document options"
                  >
                    {documentQuery.data?.title}
                    <ChevronDownIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSaveTemplateModalOpen(true)}>
                    <FileTextIcon className="size-4" />
                    Save as Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Editor Mode Switcher */}
            <div className="flex items-center gap-2 rounded-lg border p-1">
              <Button
                variant={editorMode === "student" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("student")}
                className="h-8"
              >
                Student View
              </Button>
              <Button
                variant={editorMode === "teacher-lesson" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("teacher-lesson")}
                className="h-8"
              >
                Lesson View
              </Button>
              <Button
                variant={editorMode === "teacher-editor" ? "default" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("teacher-editor")}
                className="h-8"
              >
                Editor
              </Button>
            </div>

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
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl">
          <DocumentEditor
            documentId={documentId}
            canEdit={true}
            mode={editorMode}
            token={token}
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

          <SaveToLibraryModal
            open={saveTemplateModalOpen}
            onOpenChange={setSaveTemplateModalOpen}
            type="template"
            onSave={handleSaveAsTemplate}
            isSaving={saveTemplateMutation.isPending}
          />
        </div>
      </main>
    </div>
  );
}

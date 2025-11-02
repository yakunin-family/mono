import { convexQuery, useConvex } from "@convex-dev/react-query";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { api } from "@mono/backend";
import { Button, Field, FieldLabel, Input } from "@mono/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import * as Y from "yjs";

import { ShareLessonModal } from "@/components/ShareLessonModal";

export const Route = createFileRoute("/_protected/lesson/$id")({
  component: LessonEditorPage,
});

function LessonEditorPage() {
  const { id } = useParams({ from: "/_protected/lesson/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const convex = useConvex();

  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch lesson data
  const { data: lessonData, isLoading } = useQuery(
    convexQuery(api.lessons.getLesson, { lessonId: id as any }),
  );

  // Update lesson metadata
  const updateLessonMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string }) => {
      return convex.mutation(api.lessons.updateLesson, {
        lessonId: id as any,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["convex", api.lessons.getLesson],
      });
      setIsEditing(false);
    },
  });

  // Controlled form values: use edited values when editing, server data otherwise
  const title = isEditing ? editedTitle : (lessonData?.lesson.title ?? "");
  const description = isEditing
    ? editedDescription
    : (lessonData?.lesson.description ?? "");

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure(),
        Collaboration.configure({
          document: new Y.Doc(),
        }),
      ],
      immediatelyRender: false,
      editable: lessonData?.canEdit ?? true,
    },
    [lessonData?.canEdit], // Update editor when canEdit changes
  );

  useEffect(() => {
    if (!editor || !lessonData?.lesson) return;

    // Get the Y.Doc from the editor
    const ydoc = editor.extensionManager.extensions.find(
      (ext) => ext.name === "collaboration",
    )?.options.document as Y.Doc;

    if (!ydoc) return;

    // Connect to the Hocuspocus server
    const provider = new HocuspocusProvider({
      url: "ws://127.0.0.1:1234",
      name: id, // Use lesson ID as document name
      document: ydoc,
      onStatus: ({ status }) => {
        setStatus(status);
      },
      onAwarenessUpdate: ({ states }) => {
        setConnectedUsers(states.length);
      },
    });

    return () => {
      provider.destroy();
    };
  }, [editor, id, lessonData]);

  const handleSaveMetadata = () => {
    updateLessonMutation.mutate({ title, description });
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  if (!lessonData?.lesson) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Lesson Not Found</h1>
        <p className="text-muted-foreground">
          This lesson doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate({ to: "/" })}>Back to Dashboard</Button>
      </div>
    );
  }

  const { lesson, canEdit, role } = lessonData;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/" })}
            >
              ← Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`size-2 rounded-full ${getStatusColor()}`} />
                <span className="text-muted-foreground capitalize">
                  {status}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {connectedUsers} {connectedUsers === 1 ? "user" : "users"}{" "}
                online
              </div>
              {canEdit && (
                <Button size="sm" onClick={() => setIsShareModalOpen(true)}>
                  Share with Students
                </Button>
              )}
            </div>
          </div>

          {/* Lesson Metadata */}
          {isEditing && canEdit ? (
            <div className="space-y-2">
              <Field>
                <FieldLabel>Lesson Title</FieldLabel>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  disabled={updateLessonMutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  disabled={updateLessonMutation.isPending}
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveMetadata}
                  disabled={updateLessonMutation.isPending}
                >
                  {updateLessonMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateLessonMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedTitle(lesson.title);
                      setEditedDescription(lesson.description || "");
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {lesson.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {lesson.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Role: {role}</span>
                <span>
                  {canEdit ? "Full edit access" : "View and limited edit"}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 bg-muted p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
              <Button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                variant={editor?.isActive("bold") ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
              >
                Bold
              </Button>
              <Button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                variant={editor?.isActive("italic") ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
              >
                Italic
              </Button>
              <Button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                variant={editor?.isActive("strike") ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
              >
                Strike
              </Button>
              <Button
                onClick={() => editor?.chain().focus().toggleCode().run()}
                variant={editor?.isActive("code") ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
              >
                Code
              </Button>
              <div className="w-px bg-border" />
              <Button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                variant={
                  editor?.isActive("heading", { level: 1 })
                    ? "default"
                    : "outline"
                }
                size="sm"
                disabled={!canEdit}
              >
                H1
              </Button>
              <Button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                variant={
                  editor?.isActive("heading", { level: 2 })
                    ? "default"
                    : "outline"
                }
                size="sm"
                disabled={!canEdit}
              >
                H2
              </Button>
              <Button
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run()
                }
                variant={
                  editor?.isActive("heading", { level: 3 })
                    ? "default"
                    : "outline"
                }
                size="sm"
                disabled={!canEdit}
              >
                H3
              </Button>
              <div className="w-px bg-border" />
              <Button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                variant={editor?.isActive("bulletList") ? "default" : "outline"}
                size="sm"
                disabled={!canEdit}
              >
                Bullet List
              </Button>
              <Button
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                variant={
                  editor?.isActive("orderedList") ? "default" : "outline"
                }
                size="sm"
                disabled={!canEdit}
              >
                Ordered List
              </Button>
            </div>

            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none dark:prose-invert [&_.tiptap]:min-h-[500px] [&_.tiptap]:outline-none"
            />
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {canEdit && (
        <ShareLessonModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          lessonId={id}
        />
      )}
    </div>
  );
}

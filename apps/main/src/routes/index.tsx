import { Button } from "@mono/ui";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

import { signOut, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context.userId) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: App,
});

function App() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello World!</p>",
    immediatelyRender: false,
  });

  // Memoize the provider value to avoid unnecessary re-renders
  const providerValue = useMemo(() => ({ editor }), [editor]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            Acme Inc.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        <EditorContext.Provider value={providerValue}>
          <EditorContent editor={editor} />
          <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
          <BubbleMenu editor={editor ?? undefined}>
            This is the bubble menu
          </BubbleMenu>
        </EditorContext.Provider>
      </main>
    </div>
  );
}

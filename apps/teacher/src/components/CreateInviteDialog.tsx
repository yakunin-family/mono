import { api } from "@app/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@package/ui";
import { useMutation } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { CheckIcon, CopyIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getStudentAppUrl(): string {
  if (typeof window !== "undefined" && import.meta.env.VITE_STUDENT_APP_URL) {
    return import.meta.env.VITE_STUDENT_APP_URL;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3001";
  }
  return "https://student.untitled.nikita-yakunin.dev";
}

export function CreateInviteDialog({
  open,
  onOpenChange,
}: CreateInviteDialogProps) {
  const convex = useConvex();
  const [language, setLanguage] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInviteMutation = useMutation({
    mutationFn: async (lang: string) => {
      return await convex.mutation(api.spaceInvites.createInvite, {
        language: lang,
      });
    },
    onSuccess: (result) => {
      const studentAppUrl = getStudentAppUrl();
      setInviteLink(`${studentAppUrl}/join/${result.token}`);
    },
  });

  const handleCreate = () => {
    const trimmed = language.trim();
    if (!trimmed) return;
    createInviteMutation.mutate(trimmed);
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setLanguage("");
    setInviteLink(null);
    setCopied(false);
    createInviteMutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Student</DialogTitle>
          <DialogDescription>
            Create an invite link for a new student. Specify the language you
            will be teaching them.
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  placeholder="e.g., German, Business English, French (Beginners)"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  You can use any text to describe the course
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!language.trim() || createInviteMutation.isPending}
              >
                {createInviteMutation.isPending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                Create Invite
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Invite Link for {language}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckIcon className="size-4 text-green-600" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your student. When they click it and sign
                  up, they will automatically join your {language} lessons.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { api, type Id } from "@app/backend";
import { Badge, Button, Card, CardContent } from "@package/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { CheckIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

interface Invite {
  _id: Id<"spaceInvites">;
  language: string;
  token: string;
  createdAt: number;
  isPending: boolean;
}

interface InvitesListProps {
  invites: Invite[];
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

export function InvitesList({ invites }: InvitesListProps) {
  return (
    <div className="space-y-2">
      {invites.map((invite) => (
        <InviteCard key={invite._id} invite={invite} />
      ))}
    </div>
  );
}

function InviteCard({ invite }: { invite: Invite }) {
  const convex = useConvex();
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: async () => {
      await convex.mutation(api.spaceInvites.revokeInvite, {
        inviteId: invite._id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaceInvites"] });
    },
  });

  const studentAppUrl = getStudentAppUrl();
  const inviteLink = `${studentAppUrl}/join/${invite.token}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke this invite?")) {
      revokeMutation.mutate();
    }
  };

  const createdDate = new Date(invite.createdAt).toLocaleDateString();

  return (
    <Card className="py-0">
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{invite.language}</Badge>
            <span className="text-xs text-muted-foreground">
              Created {createdDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <CheckIcon className="size-4 text-green-600" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

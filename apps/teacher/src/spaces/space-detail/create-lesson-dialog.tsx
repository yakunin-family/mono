import { api, type Id } from "@app/backend";
import { convexQuery } from "@convex-dev/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
}

const DEFAULT_LESSON_TITLE = "Untitled Lesson";

export function CreateLessonDialog({
  open,
  onOpenChange,
  spaceId,
}: CreateLessonDialogProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(DEFAULT_LESSON_TITLE);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const nextNumberQuery = useQuery({
    ...convexQuery(api.documents.getNextLessonNumber, {
      spaceId: spaceId as Id<"spaces">,
    }),
    enabled: open,
  });

  const templatesQuery = useQuery({
    ...convexQuery(api.library.getMyItems, { type: "template" }),
    enabled: open,
  });

  const handleCreate = () => {
    const trimmedTitle = title.trim();

    navigate({
      to: "/spaces/$id/lesson/new",
      params: { id: spaceId },
      search: {
        title:
          trimmedTitle && trimmedTitle !== DEFAULT_LESSON_TITLE
            ? trimmedTitle
            : undefined,
        template: selectedTemplateId || undefined,
      },
    });
  };

  const handleClose = () => {
    setTitle(DEFAULT_LESSON_TITLE);
    setSelectedTemplateId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lesson #{nextNumberQuery.data}</DialogTitle>
          <DialogDescription>
            Add a new lesson for this student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              placeholder="e.g., Passive Voice, Present Perfect, Vocabulary Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              You can change this later
            </p>
          </div>

          <div className="space-y-2">
            <Label>Start from template</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Blank lesson" />
              </SelectTrigger>
              <SelectContent>
                {templatesQuery.data?.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Lesson</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

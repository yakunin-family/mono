import { api } from "@app/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@package/ui";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { FileTextIcon, LayoutTemplateIcon, PlusIcon } from "lucide-react";

interface Template {
  _id: string;
  title: string;
  content: string;
  description?: string;
  createdAt: number;
}

interface NewDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBlank: () => void;
  onCreateFromTemplate: (templateContent: string) => void;
  isCreating: boolean;
}

export function NewDocumentModal({
  open,
  onOpenChange,
  onCreateBlank,
  onCreateFromTemplate,
  isCreating,
}: NewDocumentModalProps) {
  const convex = useConvex();

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const items = await convex.query(api.exerciseBank.getMyItems, {
        type: "template",
      });
      return items as Template[];
    },
    enabled: open,
  });

  const templates = templatesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Start with a blank document or choose from your saved templates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Start from Scratch */}
          <div className="space-y-2">
            <Button
              onClick={onCreateBlank}
              disabled={isCreating}
              className="w-full justify-start h-auto py-4"
              variant="outline"
            >
              <PlusIcon className="mr-3 size-5" />
              <div className="text-left">
                <div className="font-medium">Start from Scratch</div>
                <div className="text-xs text-muted-foreground">
                  Create an empty document
                </div>
              </div>
            </Button>
          </div>

          {/* Templates Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <LayoutTemplateIcon className="size-4" />
              <span>Your Templates</span>
            </div>

            {templatesQuery.isLoading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Loading templates...
              </p>
            ) : templates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <FileTextIcon className="mx-auto mb-2 size-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No templates saved yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Save a document as a template to reuse it here.
                </p>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template._id}
                    onClick={() => onCreateFromTemplate(template.content)}
                    disabled={isCreating}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LayoutTemplateIcon className="mt-0.5 size-5 text-purple-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{template.title}</div>
                      {template.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Saved {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

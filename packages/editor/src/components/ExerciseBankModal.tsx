import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@package/ui";
import { CheckIcon, FileTextIcon } from "lucide-react";
import { useState, useEffect } from "react";

export interface BankedExercise {
  _id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface ExerciseBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: BankedExercise[];
  isLoading: boolean;
  onInsert: (selectedIds: string[]) => void;
}

export function ExerciseBankModal({
  open,
  onOpenChange,
  exercises,
  isLoading,
  onInsert,
}: ExerciseBankModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelected(new Set());
    }
  }, [open]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleInsert = () => {
    onInsert(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert from Exercise Bank</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto max-h-96 py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading...
            </p>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8">
              <FileTextIcon className="mx-auto mb-2 size-10 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No exercises in your bank yet.
              </p>
            </div>
          ) : (
            exercises.map((exercise) => (
              <div
                key={exercise._id}
                onClick={() => toggleSelection(exercise._id)}
                className={`flex items-center gap-3 rounded border p-3 cursor-pointer transition-colors ${
                  selected.has(exercise._id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    selected.has(exercise._id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground"
                  }`}
                >
                  {selected.has(exercise._id) && (
                    <CheckIcon className="h-3 w-3" />
                  )}
                </div>
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {exercise.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(exercise.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={selected.size === 0}>
            Insert{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

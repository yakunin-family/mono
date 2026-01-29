import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import type { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";

interface RowHandleProps {
  editor: Editor;
  rowIndex: number;
  position: { x: number; y: number };
  isLastRow: boolean;
  tableElement: HTMLTableElement;
}

function selectRow(
  editor: Editor,
  tableElement: HTMLTableElement,
  rowIndex: number,
) {
  const rows = Array.from(tableElement.querySelectorAll("tr"));
  const targetRow = rows[rowIndex];
  if (!targetRow) return;

  const cells = Array.from(targetRow.querySelectorAll("th, td"));
  const firstCell = cells[0];
  const lastCell = cells[cells.length - 1];
  if (!firstCell || !lastCell) return;

  const view = editor.view;

  const anchorPos = view.posAtDOM(firstCell, 0);
  const headPos = view.posAtDOM(lastCell, 0);

  const selection = new CellSelection(
    view.state.doc.resolve(anchorPos),
    view.state.doc.resolve(headPos),
  );

  view.dispatch(view.state.tr.setSelection(selection));
}

export function RowHandle({
  editor,
  rowIndex,
  position,
  isLastRow,
  tableElement,
}: RowHandleProps) {
  const runCommand = (command: () => void) => {
    // Re-focus editor and select the row before running command
    editor.commands.focus();
    // Small delay to ensure focus is restored
    requestAnimationFrame(() => {
      selectRow(editor, tableElement, rowIndex);
      command();
    });
  };

  const handleInsertAbove = () => {
    runCommand(() => editor.chain().focus().addRowBefore().run());
  };

  const handleInsertBelow = () => {
    runCommand(() => editor.chain().focus().addRowAfter().run());
  };

  const handleDelete = () => {
    runCommand(() => editor.chain().focus().deleteRow().run());
  };

  return (
    <div
      className="pointer-events-auto fixed z-50"
      style={{
        left: `${position.x - 12}px`,
        top: `${position.y - 12}px`,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-6 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          aria-label={`Row ${rowIndex + 1} options`}
        >
          <GripVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="left">
          <DropdownMenuItem onClick={handleInsertAbove}>
            <ArrowUp className="mr-2 size-4" />
            Insert Above
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInsertBelow}>
            <ArrowDown className="mr-2 size-4" />
            Insert Below
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isLastRow}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

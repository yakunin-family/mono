import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import type { Editor } from "@tiptap/core";
import { ArrowDown, ArrowUp, Copy, Eraser, Trash2 } from "lucide-react";

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
  const { CellSelection } = require("@tiptap/pm/tables");

  const anchorPos = view.posAtDOM(firstCell, 0);
  const headPos = view.posAtDOM(lastCell, 0);

  const selection = new CellSelection(
    view.state.doc.resolve(anchorPos),
    view.state.doc.resolve(headPos),
  );

  view.dispatch(view.state.tr.setSelection(selection));
}

function clearRow(
  editor: Editor,
  tableElement: HTMLTableElement,
  rowIndex: number,
) {
  selectRow(editor, tableElement, rowIndex);
  editor.chain().focus().setContent("").run();
}

function duplicateRow(
  editor: Editor,
  tableElement: HTMLTableElement,
  rowIndex: number,
) {
  selectRow(editor, tableElement, rowIndex);
  editor.chain().focus().addRowAfter().run();

  const rows = Array.from(tableElement.querySelectorAll("tr"));
  const sourceRow = rows[rowIndex];
  const targetRow = rows[rowIndex + 1];
  if (!sourceRow || !targetRow) return;

  const sourceCells = Array.from(sourceRow.querySelectorAll("th, td"));
  const targetCells = Array.from(targetRow.querySelectorAll("th, td"));

  for (let col = 0; col < sourceCells.length; col++) {
    const source = sourceCells[col];
    const target = targetCells[col];
    if (source && target) {
      target.innerHTML = source.innerHTML;
    }
  }
}

export function RowHandle({
  editor,
  rowIndex,
  position,
  isLastRow,
  tableElement,
}: RowHandleProps) {
  const handleInsertAbove = () => {
    selectRow(editor, tableElement, rowIndex);
    editor.chain().focus().addRowBefore().run();
  };

  const handleInsertBelow = () => {
    selectRow(editor, tableElement, rowIndex);
    editor.chain().focus().addRowAfter().run();
  };

  const handleDelete = () => {
    selectRow(editor, tableElement, rowIndex);
    editor.chain().focus().deleteRow().run();
  };

  const handleDuplicate = () => {
    duplicateRow(editor, tableElement, rowIndex);
  };

  const handleClear = () => {
    clearRow(editor, tableElement, rowIndex);
  };

  return (
    <div
      className="pointer-events-auto fixed z-50 flex items-center justify-center"
      style={{
        left: `${position.x - 12}px`,
        top: `${position.y - 12}px`,
        width: "24px",
        height: "24px",
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center w-5 h-5 rounded bg-muted border border-border hover:bg-accent hover:border-primary transition-colors cursor-pointer"
          aria-label={`Row ${rowIndex + 1} options`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            className="text-muted-foreground"
          >
            <circle cx="6" cy="4" r="1" />
            <circle cx="6" cy="8" r="1" />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onClick={handleInsertAbove}>
            <ArrowUp className="mr-2 size-4" />
            Insert Above
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInsertBelow}>
            <ArrowDown className="mr-2 size-4" />
            Insert Below
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClear}>
            <Eraser className="mr-2 size-4" />
            Clear
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

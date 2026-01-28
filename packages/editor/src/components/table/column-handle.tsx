import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import type { Editor } from "@tiptap/core";
import { ArrowLeft, ArrowRight, Copy, Eraser, Trash2 } from "lucide-react";

interface ColumnHandleProps {
  editor: Editor;
  columnIndex: number;
  position: { x: number; y: number };
  isLastColumn: boolean;
  tableElement: HTMLTableElement;
}

function selectColumn(
  editor: Editor,
  tableElement: HTMLTableElement,
  columnIndex: number,
) {
  const rows = Array.from(tableElement.querySelectorAll("tr"));
  if (rows.length === 0) return;

  const firstRow = rows[0];
  if (!firstRow) return;

  const firstCell = firstRow.querySelectorAll("th, td")[columnIndex];
  if (!firstCell) return;

  const view = editor.view;
  const pos = view.posAtDOM(firstCell, 0);
  const resolvedPos = view.state.doc.resolve(pos);

  const { CellSelection } = require("@tiptap/pm/tables");
  const tablePos = resolvedPos.before(resolvedPos.depth - 1);
  const tableNode = view.state.doc.nodeAt(tablePos);
  if (!tableNode) return;

  const map = require("@tiptap/pm/tables").TableMap.get(tableNode);
  if (!map) return;

  const cellsInColumn = map.cellsInRect({
    left: columnIndex,
    right: columnIndex + 1,
    top: 0,
    bottom: map.rows,
  });

  if (cellsInColumn.length === 0) return;

  const anchorCell = tablePos + 1 + cellsInColumn[0];
  const headCell = tablePos + 1 + cellsInColumn[cellsInColumn.length - 1];

  const selection = new CellSelection(
    view.state.doc.resolve(anchorCell),
    view.state.doc.resolve(headCell),
  );

  view.dispatch(view.state.tr.setSelection(selection));
}

function clearColumn(
  editor: Editor,
  tableElement: HTMLTableElement,
  columnIndex: number,
) {
  selectColumn(editor, tableElement, columnIndex);
  editor.chain().focus().setContent("").run();
}

function duplicateColumn(
  editor: Editor,
  tableElement: HTMLTableElement,
  columnIndex: number,
) {
  selectColumn(editor, tableElement, columnIndex);
  editor.chain().focus().addColumnAfter().run();

  const rows = Array.from(tableElement.querySelectorAll("tr"));
  for (let row = 0; row < rows.length; row++) {
    const currentRow = rows[row];
    if (!currentRow) continue;
    const cells = Array.from(currentRow.querySelectorAll("th, td"));
    const sourceCell = cells[columnIndex];
    const targetCell = cells[columnIndex + 1];
    if (sourceCell && targetCell) {
      targetCell.innerHTML = sourceCell.innerHTML;
    }
  }
}

export function ColumnHandle({
  editor,
  columnIndex,
  position,
  isLastColumn,
  tableElement,
}: ColumnHandleProps) {
  const handleInsertLeft = () => {
    selectColumn(editor, tableElement, columnIndex);
    editor.chain().focus().addColumnBefore().run();
  };

  const handleInsertRight = () => {
    selectColumn(editor, tableElement, columnIndex);
    editor.chain().focus().addColumnAfter().run();
  };

  const handleDelete = () => {
    selectColumn(editor, tableElement, columnIndex);
    editor.chain().focus().deleteColumn().run();
  };

  const handleDuplicate = () => {
    duplicateColumn(editor, tableElement, columnIndex);
  };

  const handleClear = () => {
    clearColumn(editor, tableElement, columnIndex);
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
          aria-label={`Column ${columnIndex + 1} options`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            className="text-muted-foreground"
          >
            <circle cx="4" cy="6" r="1" />
            <circle cx="8" cy="6" r="1" />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top">
          <DropdownMenuItem onClick={handleInsertLeft}>
            <ArrowLeft className="mr-2 size-4" />
            Insert Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInsertRight}>
            <ArrowRight className="mr-2 size-4" />
            Insert Right
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
            disabled={isLastColumn}
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

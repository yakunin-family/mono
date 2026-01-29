import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@package/ui";
import type { Editor } from "@tiptap/core";
import { CellSelection, TableMap } from "@tiptap/pm/tables";
import { ArrowLeft, ArrowRight, GripHorizontal, Trash2 } from "lucide-react";

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

  // Find the table node by walking up the tree
  let tableDepth = resolvedPos.depth;
  while (tableDepth > 0 && resolvedPos.node(tableDepth).type.name !== "table") {
    tableDepth--;
  }
  if (tableDepth === 0) return;

  const tablePos = resolvedPos.before(tableDepth);
  const tableNode = resolvedPos.node(tableDepth);
  if (!tableNode || tableNode.type.name !== "table") return;

  const map = TableMap.get(tableNode);
  if (!map) return;

  const cellsInColumn = map.cellsInRect({
    left: columnIndex,
    right: columnIndex + 1,
    top: 0,
    bottom: map.height,
  });

  if (cellsInColumn.length === 0) return;

  const firstCellPos = cellsInColumn[0];
  const lastCellPos = cellsInColumn[cellsInColumn.length - 1];
  if (firstCellPos === undefined || lastCellPos === undefined) return;

  const anchorCell = tablePos + 1 + firstCellPos;
  const headCell = tablePos + 1 + lastCellPos;

  const selection = new CellSelection(
    view.state.doc.resolve(anchorCell),
    view.state.doc.resolve(headCell),
  );

  view.dispatch(view.state.tr.setSelection(selection));
}

export function ColumnHandle({
  editor,
  columnIndex,
  position,
  isLastColumn,
  tableElement,
}: ColumnHandleProps) {
  const runCommand = (command: () => void) => {
    // Re-focus editor and select the column before running command
    editor.commands.focus();
    // Small delay to ensure focus is restored
    requestAnimationFrame(() => {
      selectColumn(editor, tableElement, columnIndex);
      command();
    });
  };

  const handleInsertLeft = () => {
    runCommand(() => editor.chain().focus().addColumnBefore().run());
  };

  const handleInsertRight = () => {
    runCommand(() => editor.chain().focus().addColumnAfter().run());
  };

  const handleDelete = () => {
    runCommand(() => editor.chain().focus().deleteColumn().run());
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
          aria-label={`Column ${columnIndex + 1} options`}
        >
          <GripHorizontal className="size-4" />
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

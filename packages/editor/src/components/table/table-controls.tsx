import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ColumnHandle } from "./column-handle";
import { QuickAddButton } from "./quick-add-button";
import { RowHandle } from "./row-handle";

export interface ColumnHandleProps {
  editor: Editor;
  columnIndex: number;
  position: { x: number; y: number };
  isLastColumn: boolean;
  tableElement: HTMLTableElement;
}

export interface RowHandleProps {
  editor: Editor;
  rowIndex: number;
  position: { x: number; y: number };
  isLastRow: boolean;
  tableElement: HTMLTableElement;
}

export interface QuickAddButtonProps {
  editor: Editor;
  variant: "row" | "column";
  position: { x: number; y: number };
}

interface TableControlsProps {
  editor: Editor;
}

interface HandlePosition {
  x: number;
  y: number;
  index: number;
}

function getTableBounds(table: HTMLTableElement) {
  return table.getBoundingClientRect();
}

function isMouseNearTable(
  mouseX: number,
  mouseY: number,
  tableRect: DOMRect,
  threshold: number = 20,
) {
  return (
    mouseX >= tableRect.left - threshold &&
    mouseX <= tableRect.right + threshold &&
    mouseY >= tableRect.top - threshold &&
    mouseY <= tableRect.bottom + threshold
  );
}

function findClosestTable(
  mouseX: number,
  mouseY: number,
  tables: HTMLTableElement[],
): HTMLTableElement | null {
  let closest: HTMLTableElement | null = null;
  let closestDist = Infinity;

  for (const table of tables) {
    const rect = getTableBounds(table);
    if (isMouseNearTable(mouseX, mouseY, rect)) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist =
        (mouseX - centerX) * (mouseX - centerX) +
        (mouseY - centerY) * (mouseY - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = table;
      }
    }
  }

  return closest;
}

function calculatePositions(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));
  const columnPositions: HandlePosition[] = [];
  const rowPositions: HandlePosition[] = [];

  const firstRow = rows[0];
  if (!firstRow) {
    return { columnPositions, rowPositions, totalRows: 0, totalColumns: 0 };
  }

  const firstRowCells = Array.from(firstRow.querySelectorAll("th, td"));
  const totalColumns = firstRowCells.length;
  const totalRows = rows.length;

  for (let col = 0; col < totalColumns; col++) {
    const cell = firstRowCells[col];
    if (cell) {
      const rect = cell.getBoundingClientRect();
      columnPositions.push({
        x: rect.left + rect.width / 2,
        y: rect.top - 16,
        index: col,
      });
    }
  }

  for (let row = 0; row < totalRows; row++) {
    const currentRow = rows[row];
    if (!currentRow) continue;
    const cells = Array.from(currentRow.querySelectorAll("th, td"));
    const lastCell = cells[cells.length - 1];
    if (lastCell) {
      const rect = lastCell.getBoundingClientRect();
      rowPositions.push({
        x: rect.right + 16,
        y: rect.top + rect.height / 2,
        index: row,
      });
    }
  }

  return { columnPositions, rowPositions, totalRows, totalColumns };
}

export function TableControls({ editor }: TableControlsProps) {
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [columnPositions, setColumnPositions] = useState<HandlePosition[]>([]);
  const [rowPositions, setRowPositions] = useState<HandlePosition[]>([]);
  const [addRowPosition, setAddRowPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [addColumnPosition, setAddColumnPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [totalColumns, setTotalColumns] = useState(0);

  const rafRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const isTeacherEditor = editor.storage.editorMode === "teacher-editor";

  const recalculatePositions = useCallback(() => {
    if (!activeTable) return;

    if (!document.contains(activeTable)) {
      setActiveTable(null);
      return;
    }

    const {
      columnPositions: cols,
      rowPositions: rows,
      totalRows: tRows,
      totalColumns: tCols,
    } = calculatePositions(activeTable);

    setColumnPositions(cols);
    setRowPositions(rows);
    setTotalRows(tRows);
    setTotalColumns(tCols);

    const tableRect = getTableBounds(activeTable);
    setAddRowPosition({
      x: tableRect.left + tableRect.width / 2,
      y: tableRect.bottom + 4,
    });
    setAddColumnPosition({
      x: tableRect.right + 4,
      y: tableRect.top + tableRect.height / 2,
    });
  }, [activeTable]);

  useEffect(() => {
    recalculatePositions();
  }, [recalculatePositions]);

  useEffect(() => {
    if (!isTeacherEditor) return;

    const editorDom = editor.view.dom;

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const tables = Array.from(
          editorDom.querySelectorAll<HTMLTableElement>("table"),
        );
        const closest = findClosestTable(e.clientX, e.clientY, tables);

        if (closest !== activeTable) {
          setActiveTable(closest);
        } else if (closest) {
          recalculatePositions();
        }
      });
    };

    const handleMouseLeave = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setActiveTable(null);
    };

    editorDom.addEventListener("mousemove", handleMouseMove);
    editorDom.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      editorDom.removeEventListener("mousemove", handleMouseMove);
      editorDom.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [editor, isTeacherEditor, activeTable, recalculatePositions]);

  useEffect(() => {
    if (!activeTable) return;

    const handleScrollOrResize = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        recalculatePositions();
      });
    };

    window.addEventListener("scroll", handleScrollOrResize, { capture: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, {
        capture: true,
      });
      window.removeEventListener("resize", handleScrollOrResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeTable, recalculatePositions]);

  useEffect(() => {
    if (!isTeacherEditor) return;

    const handleUpdate = () => {
      if (activeTable && document.contains(activeTable)) {
        recalculatePositions();
      }
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, isTeacherEditor, activeTable, recalculatePositions]);

  if (!isTeacherEditor || !activeTable) return null;

  return createPortal(
    <div className="pointer-events-none">
      {columnPositions.map((pos) => (
        <ColumnHandle
          key={`col-${pos.index}`}
          editor={editor}
          columnIndex={pos.index}
          position={{ x: pos.x, y: pos.y }}
          isLastColumn={totalColumns <= 1}
          tableElement={activeTable}
        />
      ))}

      {rowPositions.map((pos) => (
        <RowHandle
          key={`row-${pos.index}`}
          editor={editor}
          rowIndex={pos.index}
          position={{ x: pos.x, y: pos.y }}
          isLastRow={totalRows <= 1}
          tableElement={activeTable}
        />
      ))}

      {addRowPosition && (
        <QuickAddButton
          editor={editor}
          variant="row"
          position={addRowPosition}
        />
      )}

      {addColumnPosition && (
        <QuickAddButton
          editor={editor}
          variant="column"
          position={addColumnPosition}
        />
      )}
    </div>,
    document.body,
  );
}

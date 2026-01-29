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
        y: rect.top,
        index: col,
      });
    }
  }

  for (let row = 0; row < totalRows; row++) {
    const currentRow = rows[row];
    if (!currentRow) continue;
    const cells = Array.from(currentRow.querySelectorAll("th, td"));
    const firstCell = cells[0];
    if (firstCell) {
      const rect = firstCell.getBoundingClientRect();
      rowPositions.push({
        x: rect.left,
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
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const isOverControlsRef = useRef(false);

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

  // Track selected cell's column and row
  useEffect(() => {
    if (!isTeacherEditor || !activeTable) {
      setSelectedColumn(null);
      setSelectedRow(null);
      return;
    }

    const updateSelectedCell = () => {
      const { selection } = editor.state;
      const { $anchor } = selection;

      // Find if we're in a table cell
      let depth = $anchor.depth;
      while (depth > 0) {
        const node = $anchor.node(depth);
        if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
          break;
        }
        depth--;
      }

      if (depth === 0) {
        setSelectedColumn(null);
        setSelectedRow(null);
        return;
      }

      // Get the DOM element for the cell
      const cellPos = $anchor.before(depth);
      const cellDom = editor.view.nodeDOM(cellPos);
      if (!cellDom || !(cellDom instanceof HTMLElement)) {
        setSelectedColumn(null);
        setSelectedRow(null);
        return;
      }

      // Check if this cell is in the active table
      const cellTable = cellDom.closest("table");
      if (cellTable !== activeTable) {
        setSelectedColumn(null);
        setSelectedRow(null);
        return;
      }

      // Find row and column index
      const row = cellDom.closest("tr");
      if (!row) {
        setSelectedColumn(null);
        setSelectedRow(null);
        return;
      }

      const rows = Array.from(activeTable.querySelectorAll("tr"));
      const rowIndex = rows.indexOf(row);
      const cells = Array.from(row.querySelectorAll("th, td"));
      const colIndex = cells.indexOf(cellDom as HTMLTableCellElement);

      setSelectedRow(rowIndex >= 0 ? rowIndex : null);
      setSelectedColumn(colIndex >= 0 ? colIndex : null);
    };

    updateSelectedCell();
    editor.on("selectionUpdate", updateSelectedCell);
    editor.on("focus", updateSelectedCell);

    return () => {
      editor.off("selectionUpdate", updateSelectedCell);
      editor.off("focus", updateSelectedCell);
    };
  }, [editor, isTeacherEditor, activeTable]);

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

    const handleMouseLeave = (e: MouseEvent) => {
      // Don't hide if mouse moved to the controls
      if (isOverControlsRef.current) {
        return;
      }

      // Check if the related target is within the controls
      const relatedTarget = e.relatedTarget as Node | null;
      if (relatedTarget && controlsRef.current?.contains(relatedTarget)) {
        return;
      }

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

  const handleControlsMouseEnter = () => {
    isOverControlsRef.current = true;
  };

  const handleControlsMouseLeave = (e: React.MouseEvent) => {
    isOverControlsRef.current = false;

    // Check if we're leaving to somewhere outside both controls and editor
    const relatedTarget = e.relatedTarget as Node | null;
    const editorDom = editor.view.dom;
    if (relatedTarget && !editorDom.contains(relatedTarget)) {
      // Check if we're still near the table
      const tables = Array.from(
        editorDom.querySelectorAll<HTMLTableElement>("table"),
      );
      const closest = findClosestTable(
        mousePositionRef.current.x,
        mousePositionRef.current.y,
        tables,
      );
      if (!closest) {
        setActiveTable(null);
      }
    }
  };

  // Only show handle for the selected column/row
  const selectedColumnPosition = columnPositions.find(
    (pos) => pos.index === selectedColumn,
  );
  const selectedRowPosition = rowPositions.find(
    (pos) => pos.index === selectedRow,
  );

  return createPortal(
    <div
      ref={controlsRef}
      className="pointer-events-none"
      onMouseEnter={handleControlsMouseEnter}
      onMouseLeave={handleControlsMouseLeave}
    >
      {selectedColumnPosition && (
        <ColumnHandle
          key={`col-${selectedColumnPosition.index}`}
          editor={editor}
          columnIndex={selectedColumnPosition.index}
          position={{ x: selectedColumnPosition.x, y: selectedColumnPosition.y }}
          isLastColumn={totalColumns <= 1}
          tableElement={activeTable}
        />
      )}

      {selectedRowPosition && (
        <RowHandle
          key={`row-${selectedRowPosition.index}`}
          editor={editor}
          rowIndex={selectedRowPosition.index}
          position={{ x: selectedRowPosition.x, y: selectedRowPosition.y }}
          isLastRow={totalRows <= 1}
          tableElement={activeTable}
        />
      )}

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

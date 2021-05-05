/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useCallback, useEffect, useState } from "react";
import { Nonogram, CellState } from "src/nonogram/nonogram_types";
import { colors } from "src/theme";

// TODO: improve these styles
const nonogramBoardStyle = css`
  border: 1px solid ${colors.black};
  border-radius: 3px;
  display: flex;
  justify-content: center;
  align-items: center;

  .cellGrid {
    display: grid;
    gap: 0px;
    color: ${colors.gray};

    .cell {
      border: 1px solid ${colors.black};

      &.${CellState.BLANK} {
        background-color: ${colors.white};
      }

      &.${CellState.FILLED} {
        background-color: ${colors.gray};
      }

      &.${CellState.CROSSED_OUT} {
        display: flex;
        align-items: center;
        justify-content: center;

        :after {
          content: "×";
        }
      }
    }
  }
`;

type NonogramBoardProps = {
  nonogram: Nonogram;
  onCellUpdated: (row: number, col: number, newCellState: CellState) => void;
};

export function NonogramBoard(props: NonogramBoardProps) {
  const { nonogram, onCellUpdated } = props;
  const [draggingState, setDraggingState] = useState<{
    originalDragState: CellState;
    updatedState: CellState;
    startRow: number;
    startCol: number;
    dragDirection: "vertical" | "horizontal" | null;
  } | null>(null);

  useEffect(() => {
    const onMouseUp = () => setDraggingState(null);
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  const onMouseDown = useCallback(
    (row: number, col: number, currentCellState: CellState, mouseButton: number) => {
      // mouseButton of 0 -> left click | mouseButton of 2 -> right click
      if (mouseButton !== 0 && mouseButton !== 2) {
        setDraggingState(null);
        return;
      }

      let updatedState: CellState;
      if (mouseButton === 0) {
        updatedState = currentCellState === CellState.FILLED ? CellState.BLANK : CellState.FILLED;
      } else {
        updatedState =
          currentCellState === CellState.CROSSED_OUT ? CellState.BLANK : CellState.CROSSED_OUT;
      }

      setDraggingState({
        originalDragState: currentCellState,
        updatedState,
        startRow: row,
        startCol: col,
        dragDirection: null,
      });

      onCellUpdated(row, col, updatedState);
    },
    [onCellUpdated]
  );

  const onMouseOver = useCallback(
    (row: number, col: number) => {
      if (!draggingState) {
        return;
      }
      const { originalDragState, updatedState, startRow, startCol, dragDirection } = draggingState;

      // When we're dragging, we only allow one row or one column at a time to be modified to reduce
      // the chance of accidental changes.
      if (dragDirection === null && (row !== startRow || col !== startCol)) {
        setDraggingState({
          ...draggingState,
          dragDirection: row !== startRow ? "vertical" : "horizontal",
        });
      }

      let targetRow, targetCol;
      if (dragDirection === "vertical") {
        [targetRow, targetCol] = [row, startCol];
      } else if (dragDirection === "horizontal") {
        [targetRow, targetCol] = [startRow, col];
      } else {
        [targetRow, targetCol] = [row, col];
      }

      // Additionally, we only update a cell's state from X to Y if the cell that started the drag
      // was originally in state X.
      const targetCellState = nonogram.cells[targetRow][targetCol];
      if (targetCellState === originalDragState) {
        onCellUpdated(targetRow, targetCol, updatedState);
      }
    },
    [draggingState, nonogram, onCellUpdated]
  );

  const renderedCells = [];
  for (let row = 0; row < nonogram.cells.length; ++row) {
    for (let col = 0; col < nonogram.cells[row].length; ++col) {
      const cellState = nonogram.cells[row][col];
      renderedCells.push(
        <div
          key={`${row}-${col}`}
          className={`cell ${cellState}`}
          onMouseDown={(event) => onMouseDown(row, col, cellState, event.nativeEvent.button)}
          onMouseOver={() => onMouseOver(row, col)}
        />
      );
    }
  }

  const { colCounts, rowCounts } = nonogram;
  const gridCellSize = "40px"; // TODO: make this responsive
  return (
    <div css={nonogramBoardStyle} onContextMenu={(e) => e.preventDefault()}>
      <div>
        <div
          onDragStart={(e) => e.preventDefault()}
          className="cellGrid"
          css={css`
            grid-template-columns: repeat(${colCounts.length}, ${gridCellSize});
            grid-template-rows: repeat(${rowCounts.length}, ${gridCellSize});
            font-size: ${gridCellSize};
          `}
        >
          {renderedCells}
        </div>
      </div>
    </div>
  );
}

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Nonogram,
  CellState,
  CellUpdateAction,
  SolutionCorrectnessStatus,
} from "src/utils/nonogram_types";
import { colors } from "src/theme";

// TODO: improve these styles
const nonogramBoardStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  .gameBoard {
    .cellGrid {
      display: grid;
      gap: 0px;
      color: ${colors.gray};

      .cell {
        width: 100%;
        height: 100%;
        border: 1px solid ${colors.black};

        &.${CellState.BLANK} {
          background-color: ${colors.white};
        }

        &.${CellState.FILLED} {
          background-color: ${colors.gray};
        }

        &.${CellState.CROSSED_OUT} {
          background-color: ${colors.white};
          display: flex;
          align-items: center;
          justify-content: center;

          :after {
            content: "×";
          }
        }

        &.solved {
          transition: background-color 3s ease;
        }
      }
    }

    // TODO: make these pixel values responsive
    .rowCounts,
    .colCounts {
      user-select: none;
      font-size: 20px;
    }

    .rowCounts {
      float: left;
      margin-right: 10px;

      > div {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        height: 40px;

        > div {
          padding-left: 7px;
        }
      }
    }

    .colCounts {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: flex-end;
      margin-bottom: 5px;

      > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        width: 40px;

        > div {
          padding-top: 3px;
        }
      }
    }
  }
`;

export const NonogramBoard = React.memo(
  (props: {
    nonogram: Nonogram;
    onCellUpdated: (row: number, col: number, newCellState: CellState) => void;
    addToActionLog: (action: CellUpdateAction) => void;
    solutionStatus: SolutionCorrectnessStatus;
  }) => {
    const { nonogram, onCellUpdated, addToActionLog, solutionStatus } = props;
    const { isSolved, isNotCompleteBecauseHasMistakes } = solutionStatus;

    const currentActionRef = useRef<CellUpdateAction | null>(null);

    useEffect(() => {
      if (isSolved) {
        return;
      }

      const onMouseUp = () => {
        if (currentActionRef.current) {
          addToActionLog(currentActionRef.current);
        }
        currentActionRef.current = null;
      };

      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mouseup", onMouseUp);
      };
    }, [addToActionLog, isSolved]);

    const onMouseDown = useCallback(
      (row: number, col: number, currentCellState: CellState, mouseButton: number) => {
        // mouseButton of 0 -> left click | mouseButton of 2 -> right click
        if (isSolved || (mouseButton !== 0 && mouseButton !== 2)) {
          currentActionRef.current = null;
          return;
        }

        let updatedCellState: CellState;
        if (mouseButton === 0) {
          updatedCellState =
            currentCellState === CellState.FILLED ? CellState.BLANK : CellState.FILLED;
        } else {
          updatedCellState =
            currentCellState === CellState.CROSSED_OUT ? CellState.BLANK : CellState.CROSSED_OUT;
        }

        // Disallow filling if the maximum allowable number of cells have been filled, but the
        // board still has mistakes.
        if (isNotCompleteBecauseHasMistakes && updatedCellState === CellState.FILLED) {
          currentActionRef.current = null;
          return;
        }

        currentActionRef.current = {
          originalCellState: currentCellState,
          updatedCellState,
          startRow: row,
          startCol: col,
          dragDirection: null,
          affectedCells: [{ row, col }],
        };

        onCellUpdated(row, col, updatedCellState);
      },
      [onCellUpdated, isNotCompleteBecauseHasMistakes, isSolved]
    );

    const onMouseOver = useCallback(
      (row: number, col: number) => {
        if (isSolved || !currentActionRef.current) {
          currentActionRef.current = null;
          return;
        }

        let { startRow, startCol } = currentActionRef.current;
        const { originalCellState, updatedCellState, dragDirection } = currentActionRef.current;

        // Disallow filling if the maximum allowable number of cells have been filled, but the
        // board still has mistakes.
        if (isNotCompleteBecauseHasMistakes && updatedCellState === CellState.FILLED) {
          return;
        }

        // When we're dragging, we only allow one row or one column at a time to be modified to
        // reduce the chance of accidental changes.
        if (dragDirection === null && (row !== startRow || col !== startCol)) {
          currentActionRef.current.dragDirection = row !== startRow ? "vertical" : "horizontal";
        }

        let endRow, endCol;
        if (dragDirection === "vertical") {
          [endRow, endCol] = [row, startCol];
        } else if (dragDirection === "horizontal") {
          [endRow, endCol] = [startRow, col];
        } else {
          [endRow, endCol] = [row, col];
        }

        if (startRow > endRow) {
          [startRow, endRow] = [endRow, startRow];
        }
        if (startCol > endCol) {
          [startCol, endCol] = [endCol, startCol];
        }

        // Additionally, we only update a cell's state from X to Y if the cell that started the drag
        // was originally in state X.
        for (let targetRow = startRow; targetRow <= endRow; ++targetRow) {
          for (let targetCol = startCol; targetCol <= endCol; ++targetCol) {
            const targetCellState = nonogram.cells[targetRow][targetCol];
            if (targetCellState === originalCellState) {
              currentActionRef.current.affectedCells.push({ row: targetRow, col: targetCol });
              onCellUpdated(targetRow, targetCol, updatedCellState);
            }
          }
        }
      },
      [nonogram, onCellUpdated, isSolved, isNotCompleteBecauseHasMistakes]
    );

    const renderedCells = [];
    for (let row = 0; row < nonogram.cells.length; ++row) {
      for (let col = 0; col < nonogram.cells[row].length; ++col) {
        const cellState = nonogram.cells[row][col];
        renderedCells.push(
          <div
            key={`${row}-${col}`}
            className={`cell ${isSolved ? "solved" : cellState}`}
            style={!isSolved ? undefined : { backgroundColor: nonogram.solutionColors[row][col] }}
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
        <div className="gameBoard">
          <div className="colCounts">
            {colCounts.map((counts, col) => (
              <div key={col}>
                {counts.map((count, i) => (
                  <div key={i}>{count}</div>
                ))}
              </div>
            ))}
          </div>
          <div>
            <div className="rowCounts">
              {rowCounts.map((counts, row) => (
                <div key={row}>
                  {counts.map((count, i) => (
                    <div key={i}>{count}</div>
                  ))}
                </div>
              ))}
            </div>
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
      </div>
    );
  }
);

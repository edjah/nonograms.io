/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Nonogram,
  CellState,
  CellUpdateAction,
  GameSessionUserState,
} from "src/utils/nonogram_types";
import { colors } from "src/theme";
import * as utils from "src/utils/common";

// TODO: improve these styles
const nonogramBoardStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;

  .gameBoard {
    position: relative;

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

export function NonogramBoard(props: {
  nonogram: Nonogram;
  activeUsers: Record<UserId, GameSessionUserState>;
  onCellUpdated: (row: number, col: number, newCellState: CellState) => void;
  onCursorPositionChange: (x: number, y: number) => void;
  undoLastAction: () => void; // TODO: make this return a boolean indicating success/failure?
  redoAction: () => void; // TODO: make this return a boolean indicating success/failure?
  addToActionLog: (action: CellUpdateAction) => void;
}) {
  const {
    nonogram,
    activeUsers,
    onCellUpdated,
    onCursorPositionChange,
    undoLastAction,
    redoAction,
    addToActionLog,
  } = props;

  const currentActionRef = useRef<CellUpdateAction | null>(null);
  const gameBoardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMouseUp = () => {
      if (currentActionRef.current) {
        addToActionLog(currentActionRef.current);
      }
      currentActionRef.current = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Don't run this if an input is currently in focus.
      if (document.activeElement instanceof HTMLInputElement) {
        return;
      }

      switch (event.code) {
        case "KeyZ":
          if (event.ctrlKey || event.metaKey) {
            if (event.shiftKey) {
              redoAction();
            } else {
              undoLastAction();
            }
          }
          break;

        case "KeyY":
          if (event.ctrlKey || event.metaKey) {
            redoAction();
            event.preventDefault();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [undoLastAction, redoAction, addToActionLog]);

  const onMouseDown = useCallback(
    (row: number, col: number, currentCellState: CellState, mouseButton: number) => {
      // mouseButton of 0 -> left click | mouseButton of 2 -> right click
      if (mouseButton !== 0 && mouseButton !== 2) {
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
    [onCellUpdated]
  );

  const onMouseOver = useCallback(
    (row: number, col: number) => {
      if (!currentActionRef.current) {
        return;
      }

      const {
        originalCellState,
        updatedCellState,
        startRow,
        startCol,
        dragDirection,
      } = currentActionRef.current;

      // When we're dragging, we only allow one row or one column at a time to be modified to reduce
      // the chance of accidental changes.
      if (dragDirection === null && (row !== startRow || col !== startCol)) {
        currentActionRef.current.dragDirection = row !== startRow ? "vertical" : "horizontal";
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
      if (targetCellState === originalCellState) {
        currentActionRef.current.affectedCells.push({ row: targetRow, col: targetCol });
        onCellUpdated(targetRow, targetCol, updatedCellState);
      }
    },
    [nonogram, onCellUpdated]
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (utils.isRateLimited("onCursorPositionChange", 20)) {
        return;
      }

      if (gameBoardRef.current) {
        const boundingBox = gameBoardRef.current.getBoundingClientRect();
        onCursorPositionChange(
          utils.round((event.clientX - boundingBox.left) / boundingBox.width, 3),
          utils.round((event.clientY - boundingBox.top) / boundingBox.height, 3)
        );
      }
    },
    [onCursorPositionChange]
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
      <div className="gameBoard" ref={gameBoardRef} onMouseMove={onMouseMove}>
        {Object.entries(activeUsers).map(([userId, { cursor, color }]) => (
          // TODO: make the cursor size responsive.
          <Cursor key={userId} color={color} x={cursor.x} y={cursor.y} size={20} />
        ))}
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

function Cursor(props: { color: string; x: number; y: number; size: number }) {
  return (
    <svg
      style={{
        position: "absolute",
        left: `calc(${100 * props.x}% - ${props.size / 4}px)`,
        top: `${100 * props.y}%`,
        zIndex: 100,
      }}
      fill={props.color}
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 0l14.4 13.4-6 .6h-1l.5 1 3.5 7.8-2.6 1.2-3.4-7.9-.4-1-.8.8L6 19.8V0" />
    </svg>
  );
}

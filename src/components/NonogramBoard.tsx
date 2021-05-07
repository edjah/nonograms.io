/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Nonogram, CellState } from "src/nonogram/nonogram_types";
import { colors } from "src/theme";
import * as utils from "src/utils/common";
import { realtimeDb } from "src/firebase";
import firebase from "firebase";
import { useUserId } from "src/utils/hooks";

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

type CellUpdateAction = {
  originalCellState: CellState;
  updatedCellState: CellState;
  startRow: number;
  startCol: number;
  dragDirection: "vertical" | "horizontal" | null;
  affectedCells: Array<{ row: number; col: number }>;
};

type GameSessionState = {
  lastUpdatedTime: utils.DateTimeIsoString;
  cursors: Record<string, { x: number; y: number }>; // Map from userId -> mouse coords
};

type NonogramBoardProps = {
  nonogram: Nonogram;
  onCellUpdated: (row: number, col: number, newCellState: CellState) => void;
};

export function NonogramBoard(props: NonogramBoardProps) {
  const { nonogram, onCellUpdated } = props;
  const [actionState, setActionState] = useState<CellUpdateAction | null>(null);
  const actionLog = useRef<Array<CellUpdateAction>>([]);
  const numValidActionsInLog = useRef<number>(0);
  // const [realtimeGameSessionId, setRealtimeGameSessionId] = useState<string | null>(null);
  const [realtimeGameSessionId] = useState<string | null>("test-abcdefg");
  const [gameSessionState, setGameSessionState] = useState<GameSessionState | null>(null);
  const [gameSessionRef, setGameSessionRef] = useState<firebase.database.Reference | null>(null);
  const gameBoardRef = useRef<HTMLDivElement | null>(null);
  const userId = useUserId();

  useEffect(() => {
    if (!realtimeGameSessionId) {
      return;
    }

    const gameSessionRef = realtimeDb.ref(realtimeGameSessionId);
    setGameSessionRef(gameSessionRef);

    // TODO: use more granular callbacks like child_added, child_changed, etc
    const onGameSessionStateChange = (snap: firebase.database.DataSnapshot) => {
      setGameSessionState(snap.val());
    };

    gameSessionRef.on("value", onGameSessionStateChange);
    return () => {
      gameSessionRef.off("value", onGameSessionStateChange);
    };
  }, [realtimeGameSessionId]);

  const undoLastAction = useCallback(() => {
    if (numValidActionsInLog.current > 0) {
      const actionToUndo = actionLog.current[--numValidActionsInLog.current];
      for (const { row, col } of actionToUndo.affectedCells) {
        onCellUpdated(row, col, actionToUndo.originalCellState);
      }
    }
  }, [onCellUpdated]);

  const redoAction = useCallback(() => {
    if (numValidActionsInLog.current < actionLog.current.length) {
      const actionToRedo = actionLog.current[numValidActionsInLog.current++];
      for (const { row, col } of actionToRedo.affectedCells) {
        onCellUpdated(row, col, actionToRedo.updatedCellState);
      }
    }
  }, [onCellUpdated]);

  useEffect(() => {
    const onMouseUp = () => {
      setActionState((oldActionState) => {
        if (oldActionState) {
          // React is running this function multiple times, so we need to check that the last
          // action log entry is not identical to the current action state to avoid duplicates.
          // TODO: figure out why this is running multiple times.
          actionLog.current.splice(numValidActionsInLog.current);
          const lastLoggedAction = actionLog.current[actionLog.current.length - 1];
          if (!utils.deepEqual(lastLoggedAction, oldActionState)) {
            actionLog.current.push(oldActionState);
            numValidActionsInLog.current = actionLog.current.length;
          }
        }
        return null;
      });
    };

    // TODO: make sure this doesn't mess with any text boxes
    const onKeyDown = (event: KeyboardEvent) => {
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
  }, [undoLastAction, redoAction]);

  const onMouseDown = useCallback(
    (row: number, col: number, currentCellState: CellState, mouseButton: number) => {
      // mouseButton of 0 -> left click | mouseButton of 2 -> right click
      if (mouseButton !== 0 && mouseButton !== 2) {
        setActionState(null);
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

      setActionState({
        originalCellState: currentCellState,
        updatedCellState,
        startRow: row,
        startCol: col,
        dragDirection: null,
        affectedCells: [{ row, col }],
      });

      onCellUpdated(row, col, updatedCellState);
    },
    [onCellUpdated]
  );

  const onMouseOver = useCallback(
    (row: number, col: number) => {
      if (!actionState) {
        return;
      }
      const { originalCellState, updatedCellState, startRow, startCol } = actionState;

      // When we're dragging, we only allow one row or one column at a time to be modified to reduce
      // the chance of accidental changes.
      let { dragDirection } = actionState;
      if (dragDirection === null && (row !== startRow || col !== startCol)) {
        dragDirection = row !== startRow ? "vertical" : "horizontal";
        setActionState({
          ...actionState,
          dragDirection,
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
      if (targetCellState === originalCellState) {
        setActionState({
          ...actionState,
          dragDirection,
          affectedCells: [...actionState.affectedCells, { row: targetRow, col: targetCol }],
        });
        onCellUpdated(targetRow, targetCol, updatedCellState);
      }
    },
    [actionState, nonogram, onCellUpdated]
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (gameSessionRef && gameBoardRef.current) {
        // Send an event to firebase about this user's cursor current position.
        // TODO: throttle this?
        const boundingBox = gameBoardRef.current.getBoundingClientRect();
        gameSessionRef.child("lastUpdatedTime").set(new Date().toISOString());
        gameSessionRef
          .child("cursors")
          .child(userId)
          .set({
            x: Math.round(event.clientX - boundingBox.left),
            y: Math.round(event.clientY - boundingBox.top),
          });
      }
    },
    [gameSessionRef, userId]
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
        {gameSessionState &&
          Object.entries(gameSessionState.cursors).map(([cursorUserId, { x, y }]) => {
            // Don't render a cursor for yourself
            if (cursorUserId === userId) {
              return null;
            }
            return <Cursor key={cursorUserId} color="#ff2222" x={x} y={y} size={20} />;
          })}
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
        left: props.x - props.size / 4,
        top: props.y,
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

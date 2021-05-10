/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as utils from "src/utils/common";
import { firebase } from "src/firebase";
import {
  Nonogram,
  GameSessionState,
  CellState,
  CellUpdateAction,
  SolutionCorrectnessStatus,
} from "src/utils/nonogram_types";
import { useOfflineUser } from "src/utils/users";
import { NonogramBoard } from "src/components/NonogramBoard";
import { ChatLog } from "src/components/ChatLog";
import { ShareLink } from "src/components/ShareLink";
import { CollaboratorCursors } from "src/components/CollaboratorCursors";
import { GameControls } from "src/components/GameControls";
import { useHistory } from "react-router";
import { triggerFireworks } from "src/components/Confetti";
import { saveLocalGameState } from "src/utils/localStorage";

const nonogramGameStyle = css`
  .upperUi {
    display: flex;
    gap: 60px;

    .boardContainer {
      position: relative;
      height: 100%;
      width: 100%;
    }
  }
`;

export function NonogramGame(props: {
  boardId: string;
  gameSessionId: string | null;
  nonogram: Nonogram;
  gameSessionRef: firebase.database.Reference | null;
  onChangeBoardId: (nextBoardId: string) => void;
}) {
  const {
    boardId,
    gameSessionId,
    gameSessionRef,
    nonogram: originalNonogram,
    onChangeBoardId,
  } = props;
  const user = useOfflineUser();
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const history = useHistory();

  const [gameSessionState, setGameSessionState] = useState<GameSessionState>(() => {
    return {
      boardId,
      lastUpdatedTime: Date.now(),
      users: {
        [user.id]: {
          name: user.name,
          color: user.color,
          lastActiveTime: Date.now(),
        },
      },
      gameState: {
        nonogram: originalNonogram,
        actionLog: [],
        numAppliedActionsInLog: 0,
      },
      chatLog: [],
    };
  });

  const solutionStatus = useMemo<SolutionCorrectnessStatus>(() => {
    // NOTE: we're not comparing against the solution field in the nonogram just in case
    // the nonogram doesn't have a unique solution even though it really should.
    const { cells, rowCounts, colCounts } = gameSessionState.gameState.nonogram;
    const numFilledCells = utils.sum(
      cells.map((row) => utils.sum(row.map((cell) => Number(cell === CellState.FILLED))))
    );
    const totalNumCellsToFill = utils.sum(rowCounts.map((counts) => utils.sum(counts)));

    function isLineWrong(line: Array<CellState>, expectedStreaks: Array<number>): boolean {
      const streaksInLine = [];
      let currentStreak = 0;
      for (const cellState of line) {
        if (cellState === CellState.FILLED) {
          currentStreak += 1;
        } else if (currentStreak > 0) {
          streaksInLine.push(currentStreak);
          currentStreak = 0;
        }
      }

      if (currentStreak > 0) {
        streaksInLine.push(currentStreak);
      }

      return !utils.deepEqual(streaksInLine, expectedStreaks);
    }

    let numMistakes = 0;
    for (let i = 0; i < rowCounts.length; ++i) {
      numMistakes += Number(isLineWrong(cells[i], rowCounts[i]));
    }

    for (let i = 0; i < colCounts.length; ++i) {
      const col = cells.map((row) => row[i]);
      numMistakes += Number(isLineWrong(col, colCounts[i]));
    }

    return {
      isSolved: numMistakes === 0 && numFilledCells === totalNumCellsToFill,
      isNotCompleteBecauseHasMistakes: numMistakes > 0 && numFilledCells >= totalNumCellsToFill,
      numMistakes,
      numFilledCells,
      totalNumCellsToFill,
    };
  }, [gameSessionState.gameState.nonogram]);

  useEffect(() => {
    // TODO: move this
    saveLocalGameState(boardId, { status: "inProgress" });

    if (!gameSessionRef) {
      return;
    }

    let isInitialSync = true;

    const usersRef = gameSessionRef.child("users");
    const gameStateRef = gameSessionRef.child("gameState");
    const chatLogRef = gameSessionRef.child("chatLog");
    const boardIdRef = gameSessionRef.child("boardId");

    // Setting up some event listeners for changes from Firebase Realtime.
    // TODO: consider using even more granular events if performance ends up being bad.
    usersRef.on("value", (snap) => {
      // Add in this user's metadata to the game session if it doesn't exist.
      const snapshotValue: GameSessionState["users"] = snap.val() ?? {};
      if (isInitialSync || !snapshotValue[user.id]?.name || !snapshotValue[user.id]?.color) {
        snapshotValue[user.id] = {
          name: user.name,
          color: user.color,
          lastActiveTime: Date.now(),
        };
        usersRef.child(user.id).set(snapshotValue[user.id]);
        isInitialSync = false;
      }

      snapshotValue[user.id].name += " (you)";
      setGameSessionState((prevState) => {
        return { ...prevState, users: snapshotValue };
      });
    });

    gameStateRef.on("value", (snap) => {
      // Firebase Realtime doesn't save empty arrays/objects. It just deletes the associated keys
      // instead. So, we need to add them back in before we use the snapshot data in code.
      const snapshotValue: GameSessionState["gameState"] = snap.val();
      if (!snapshotValue.actionLog) {
        snapshotValue.actionLog = [];
      }

      setGameSessionState((prevState) => {
        return { ...prevState, gameState: snapshotValue };
      });
    });

    chatLogRef.on("value", (snap) => {
      // Firebase represents the chat log as a map from UUIDs -> ChatMessage, so we need
      // to convert that back into an array.
      const snapshotValue: GameSessionState["chatLog"] = Object.values(snap.val() ?? {});
      setGameSessionState((prevState) => {
        return { ...prevState, chatLog: snapshotValue };
      });
    });

    // If the boardId in the game session changes, we will redirect the user to the new board.
    boardIdRef.on("value", (snap) => {
      if (snap.val() === boardId) {
        return;
      }
      history.push(`/board/${snap.val()}?session=${gameSessionId}`);
    });

    return () => {
      usersRef.off();
      gameStateRef.off();
      chatLogRef.off();
      boardIdRef.off();
    };
  }, [gameSessionRef, user, boardId, gameSessionId, history, originalNonogram]);

  // These callback functions have different behavior depending on whether the user is actively
  // connected to a realtime game session or is playing offline. If playing offline, we manually
  // update the React state. If playing online, we take advantage of the local updates provided
  // by the Firebase SDK in conjunction with the `onGameSessionStateChange` handler above to
  // skip the manual React state updates.
  const onCellUpdated = useCallback(
    (row: number, col: number, newCellState: CellState) => {
      if (gameSessionRef) {
        // TODO: figure out why using firebase.database.ServerValue.TIMESTAMP is causing transaction
        // failures.
        gameSessionRef.child("lastUpdatedTime").set(Date.now());
        gameSessionRef.child(`gameState/nonogram/cells/${row}/${col}`).set(newCellState);
      } else {
        setGameSessionState((prevState) => {
          // TODO: avoid a deep clone?
          const newGameState = utils.deepClone(prevState.gameState);
          newGameState.nonogram.cells[row][col] = newCellState;
          return { ...prevState, lastUpdatedTime: Date.now(), gameState: newGameState };
        });
      }
    },
    [gameSessionRef]
  );

  const onCursorPositionChange = useCallback(
    (event: React.MouseEvent) => {
      if (
        utils.isRateLimited("onCursorPositionChange", 20) ||
        !boardContainerRef.current ||
        !gameSessionRef
      ) {
        return;
      }

      const boundingBox = boardContainerRef.current.getBoundingClientRect();
      const x = utils.round((event.clientX - boundingBox.left) / boundingBox.width, 3);
      const y = utils.round((event.clientY - boundingBox.top) / boundingBox.height, 3);
      gameSessionRef.child(`cursors/${user.id}`).set({ x, y });

      // Rate limit lastActiveTime messages to once per second to reduce bandwidth
      if (!utils.isRateLimited("lastActiveTimeUpdate", 1000)) {
        gameSessionRef.child(`users/${user.id}/lastActiveTime`).set(Date.now());
      }
    },
    [gameSessionRef, user]
  );

  // TOOD: handle transaction failures
  const applyGameSessionStateTransaction = useCallback(
    (
      transactionFn: (gameState: GameSessionState["gameState"]) => GameSessionState["gameState"]
    ) => {
      if (gameSessionRef) {
        gameSessionRef.child("gameState").transaction((snapshotValue) => {
          if (!snapshotValue.actionLog) {
            snapshotValue.actionLog = [];
          }
          return transactionFn(snapshotValue);
        });
      } else {
        setGameSessionState((prevState) => {
          const newState = { ...prevState };
          newState.gameState = transactionFn(utils.deepClone(prevState.gameState));
          return newState;
        });
      }
    },
    [gameSessionRef]
  );

  const addToActionLog = useCallback(
    (action: CellUpdateAction) => {
      applyGameSessionStateTransaction((state) => {
        state.actionLog.splice(state.numAppliedActionsInLog);
        state.actionLog.push(action);
        state.numAppliedActionsInLog = state.actionLog.length;
        return state;
      });
    },
    [applyGameSessionStateTransaction]
  );

  const undoLastAction = useCallback(() => {
    applyGameSessionStateTransaction((state) => {
      if (state.numAppliedActionsInLog > 0) {
        const actionToUndo = state.actionLog[--state.numAppliedActionsInLog];
        for (const { row, col } of actionToUndo.affectedCells) {
          state.nonogram.cells[row][col] = actionToUndo.originalCellState;
        }
      }
      return state;
    });
  }, [applyGameSessionStateTransaction]);

  const redoAction = useCallback(() => {
    applyGameSessionStateTransaction((state) => {
      if (state.numAppliedActionsInLog < state.actionLog.length) {
        const actionToRedo = state.actionLog[state.numAppliedActionsInLog++];
        for (const { row, col } of actionToRedo.affectedCells) {
          state.nonogram.cells[row][col] = actionToRedo.updatedCellState;
        }
      }
      return state;
    });
  }, [applyGameSessionStateTransaction]);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (gameSessionRef) {
        gameSessionRef.child("chatLog").push({
          timestamp: Date.now(),
          userId: user.id,
          message,
        });
      }
    },
    [gameSessionRef, user]
  );

  // Set up an event listener for Cmd+Z, Cmd+Shift+Z, and Cmd+Y inputs
  useEffect(() => {
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

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [redoAction, undoLastAction]);

  // https://www.youtube.com/watch?v=3GwjfUFyY6M
  useEffect(() => {
    if (solutionStatus.isSolved && boardId === gameSessionState.boardId) {
      saveLocalGameState(boardId, { status: "solved" });
      triggerFireworks({ durationMs: 1000 });
    }
  }, [solutionStatus.isSolved, boardId, gameSessionState.boardId]);

  return (
    <div css={nonogramGameStyle}>
      <div className="upperUi">
        <div
          className="boardContainer"
          ref={boardContainerRef}
          onMouseMove={onCursorPositionChange}
        >
          <GameControls
            solutionStatus={solutionStatus}
            resetBoard={() => {
              const freshGameState = {
                nonogram: originalNonogram,
                actionLog: [],
                numAppliedActionsInLog: 0,
              };

              if (gameSessionRef) {
                gameSessionRef.child("gameState").set(freshGameState);
              } else {
                setGameSessionState((prevState) => {
                  return { ...prevState, gameState: freshGameState };
                });
              }
              saveLocalGameState(boardId, { status: "inProgress" });
            }}
            goToNextLevel={
              originalNonogram.nextBoardId
                ? () => onChangeBoardId(originalNonogram.nextBoardId!)
                : undefined
            }
          />
          <NonogramBoard
            nonogram={gameSessionState.gameState.nonogram}
            onCellUpdated={onCellUpdated}
            addToActionLog={addToActionLog}
            solutionStatus={solutionStatus}
          />
          <CollaboratorCursors
            gameSessionRef={gameSessionRef}
            userSessions={gameSessionState.users}
          />
        </div>

        {gameSessionRef && (
          <ChatLog
            currentUserId={user.id}
            users={gameSessionState.users}
            messages={gameSessionState.chatLog}
            onSendMessage={sendChatMessage}
          />
        )}
      </div>
      <ShareLink
        boardId={boardId}
        gameSessionId={gameSessionId}
        gameSessionState={gameSessionState}
      />
    </div>
  );
}

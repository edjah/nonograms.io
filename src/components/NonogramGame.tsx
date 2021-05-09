/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as utils from "src/utils/common";
import { firebase, realtimeDb } from "src/firebase";
import { Nonogram, GameSessionState, CellState, CellUpdateAction } from "src/utils/nonogram_types";
import { useOfflineUser } from "src/utils/users";
import { NonogramBoard } from "src/components/NonogramBoard";
import { User } from "src/utils/users";
import { useHistory } from "react-router";
import { colors } from "src/theme";
import { ChatLog } from "src/components/ChatLog";

// 30 minutes
const INACTIVE_USER_TIMEOUT_MS = 30 * 60 * 1000;

const nonogramGameStyle = css`
  .upperUi {
    display: flex;
    gap: 30px;
  }

  .shareLink {
    margin-top: 30px;
    text-align: center;
    margin-left: 30px;

    input {
      padding: 8px;
      line-height: 1.4;
      width: 100%;
      margin-bottom: 2px;
    }

    span {
      font-size: 13px;
      color: ${colors.gray};
    }
  }
`;

function getInitialGameSessionState(originalNonogram: Nonogram, user: User): GameSessionState {
  return {
    lastUpdatedTime: Date.now(),
    users: {
      [user.id]: {
        name: user.name,
        color: user.color,
        lastActiveTime: Date.now(),
        cursor: { x: 0, y: 0 },
      },
    },
    gameState: {
      nonogram: originalNonogram,
      actionLog: [],
      numAppliedActionsInLog: 0,
    },
    chatLog: [],
  };
}

function fixGameSessionStateFromFirebaseSnapshot(snapshotValue: GameSessionState): void {
  // Firebase Realtime doesn't save empty arrays/objects. It just deletes the associated keys
  // instead, so we need to add them back in before we use the snapshot data in code.
  if (!snapshotValue.gameState.actionLog) {
    snapshotValue.gameState.actionLog = [];
  }
  if (!snapshotValue.users) {
    snapshotValue.users = {};
  }

  // Additionally, Firebase represents the chat log as a map from UUIDs -> ChatMessage, so we need
  // to convert that back into an array.
  if (!snapshotValue.chatLog) {
    snapshotValue.chatLog = [];
  } else {
    snapshotValue.chatLog = Object.values(snapshotValue.chatLog);
  }
}

export function NonogramGame(props: {
  boardId: string;
  gameSessionId: string | null;
  nonogram: Nonogram;
  gameSessionRef: firebase.database.Reference | null;
}) {
  const { boardId, gameSessionId, gameSessionRef, nonogram: originalNonogram } = props;
  const user = useOfflineUser();
  const history = useHistory();

  const [gameSessionState, setGameSessionState] = useState<GameSessionState>(() => {
    return getInitialGameSessionState(originalNonogram, user);
  });

  useEffect(() => {
    if (!gameSessionRef) {
      return;
    }

    let isInitialSync = true;

    // Define a callback function for changes from Firebase, but don't register it yet.
    const onGameSessionStateChange = (snap: firebase.database.DataSnapshot) => {
      const snapshotValue: GameSessionState = snap.val();
      fixGameSessionStateFromFirebaseSnapshot(snapshotValue);

      // Add in this user's metadata to the game session if it doesn't exist.
      if (
        isInitialSync ||
        !snapshotValue.users[user.id]?.name ||
        !snapshotValue.users[user.id]?.color
      ) {
        snapshotValue.users[user.id] = {
          name: user.name,
          color: user.color,
          lastActiveTime: Date.now(),
          cursor: { x: 0, y: 0 },
        };
        gameSessionRef.child(`users/${user.id}`).set(snapshotValue.users[user.id]);
      }

      // Also modify local state to make sure you know who you are.
      snapshotValue.users[user.id].name += " (you)";
      isInitialSync = false;

      setGameSessionState(snapshotValue);
    };

    gameSessionRef.on("value", onGameSessionStateChange);
    return () => {
      gameSessionRef.off("value", onGameSessionStateChange);
    };
  }, [gameSessionRef, user, boardId]);

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
          // TODO: avoid a deep clone
          const newState = utils.deepClone(prevState);
          newState.lastUpdatedTime = Date.now();
          newState.gameState.nonogram.cells[row][col] = newCellState;
          return newState;
        });
      }
    },
    [gameSessionRef]
  );

  const onCursorPositionChange = useCallback(
    (x: number, y: number) => {
      if (gameSessionRef) {
        gameSessionRef.child(`users/${user.id}/cursor`).set({ x, y });
        // Rate limit lastActiveTime messages to once per second to reduce bandwidth
        if (!utils.isRateLimited("lastActiveTimeUpdate", 1000)) {
          gameSessionRef.child(`users/${user.id}/lastActiveTime`).set(Date.now());
        }
      } else {
        // No need to save cursor state for an offline game
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

  // If we're not currently in a session, we will create a new one using this ID.
  const tentativeGameSessionId = useMemo(() => utils.generateRandomBase62String(8), []);
  const shareUrl = `${window.location.origin}/board/${boardId}?session=${
    gameSessionId || tentativeGameSessionId
  }`;

  const activeUsers = { ...gameSessionState.users };
  for (const [userId, connectedUser] of Object.entries(activeUsers)) {
    if (connectedUser.lastActiveTime + INACTIVE_USER_TIMEOUT_MS < Date.now()) {
      delete activeUsers[userId];
    }
  }

  return (
    <div css={nonogramGameStyle}>
      <div className="upperUi">
        <NonogramBoard
          nonogram={gameSessionState.gameState.nonogram}
          activeUsers={utils.omit(activeUsers, user.id)}
          onCellUpdated={onCellUpdated}
          onCursorPositionChange={onCursorPositionChange}
          undoLastAction={undoLastAction}
          redoAction={redoAction}
          addToActionLog={addToActionLog}
        />
        {gameSessionRef && (
          <ChatLog
            currentUserId={user.id}
            allUsers={gameSessionState.users}
            activeUsers={activeUsers}
            messages={gameSessionState.chatLog}
            onSendMessage={sendChatMessage}
          />
        )}
      </div>
      <div className="shareLink">
        <input
          onClick={(event) => {
            // Copy the URL to the clipboard
            utils.assert(event.target instanceof HTMLInputElement);
            event.target.select();
            document.execCommand("copy");

            // Create a new game session in Firebase
            if (!gameSessionId) {
              realtimeDb
                .ref(tentativeGameSessionId)
                .set(gameSessionState)
                .then(() => {
                  // Once that's happened, update the URL so that the gameSessionId updates
                  history.replace(`/board/${boardId}?session=${tentativeGameSessionId}`);
                });
            }
          }}
          value={shareUrl}
          readOnly
        />
        <span>Share this link with your friends to play together.</span>
      </div>
    </div>
  );
}

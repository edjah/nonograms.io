/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as utils from "src/utils/common";
import firebase from "firebase";
import { realtimeDb } from "src/firebase";
import { Nonogram, GameSessionState, CellState, CellUpdateAction } from "src/utils/nonogram_types";
import { useOfflineUser } from "src/utils/users";
import { NonogramBoard } from "src/components/NonogramBoard";
import { User } from "src/utils/users";

const nonogramGameStyle = css`
  // TODO
`;

// TODO: switch the dates to firebase.database.ServerValue.TIMESTAMP
// TODO: figure out offline (i.e. gameSessionId=null)

function getInitialGameSessionState(originalNonogram: Nonogram, user: User): GameSessionState {
  return {
    lastUpdatedTime: new Date().toISOString(),
    nonogram: originalNonogram,
    users: {
      [user.id]: {
        name: user.name,
        color: user.color,
        lastActiveTime: new Date().toISOString(),
        cursor: { x: 0, y: 0 },
      },
    },
    actionLog: [],
    numAppliedActionsInLog: 0,
  };
}

function fixGameSessionStateFromFirebaseSnapshot(snapshotValue: GameSessionState): void {
  // An empty action log gets cleared out by Firebase, so we need to re-add it as an empty array.
  if (!snapshotValue.actionLog) {
    snapshotValue.actionLog = [];
  }
}

export function NonogramGame(props: {
  boardId: string;
  gameSessionId: string | null;
  nonogram: Nonogram;
}) {
  const { gameSessionId, nonogram: originalNonogram } = props;
  const user = useOfflineUser();

  // All of our state management will go through Firebase. Even when the user is playing offline,
  // we continue to use Firebase's API (albeit in offline mode) for simplicity.
  const gameSessionRef = useMemo(() => {
    if (gameSessionId) {
      // TODO: check if the gameSessionId exists first
      return realtimeDb.ref(gameSessionId);
    } else {
      return null;
    }
  }, [gameSessionId]);

  const [gameSessionState, setGameSessionState] = useState<GameSessionState>(() => {
    return getInitialGameSessionState(originalNonogram, user);
  });

  // Set up a listener for changes from Firebase
  useEffect(() => {
    if (!gameSessionRef) {
      return;
    }

    let isInitialSync = true;

    const onGameSessionStateChange = (snap: firebase.database.DataSnapshot) => {
      // It's likely that the first snapshot we read from Firebase will be blank, so we need to
      // correct that by setting its value to the default initial state for the nonogram.
      let snapshotValue = snap.val();
      if (!snapshotValue) {
        snapshotValue = getInitialGameSessionState(originalNonogram, user);
        gameSessionRef.set(snapshotValue);
      }

      // If this user is connecting to an existing game, we also need to make sure that Firebase has
      // the metadata (e.g. name and color) about the current user.
      if (isInitialSync) {
        gameSessionRef.child(`users/${user.id}`).set({
          name: user.name,
          color: user.color,
          lastActiveTime: new Date().toISOString(),
          cursor: { x: 0, y: 0 },
        });
        isInitialSync = false;
      }

      fixGameSessionStateFromFirebaseSnapshot(snapshotValue);
      setGameSessionState(snapshotValue);
    };

    gameSessionRef.on("value", onGameSessionStateChange);
    return () => {
      gameSessionRef.off("value", onGameSessionStateChange);
    };
  }, [gameSessionRef, originalNonogram, user]);

  // These callback functions have different behavior depending on whether the user is actively
  // connected to a realtime game session or is playing offline. If playing offline, we manually
  // update the React state. If playing online, we take advantage of the local updates provided
  // by the Firebase SDK in conjunction with the `onGameSessionStateChange` handler above to
  // skip the manual React state updates.
  const onCellUpdated = useCallback(
    (row: number, col: number, newCellState: CellState) => {
      if (gameSessionRef) {
        gameSessionRef.child("lastUpdatedTime").set(new Date().toISOString());
        gameSessionRef.child(`nonogram/cells/${row}/${col}`).set(newCellState);
      } else {
        setGameSessionState((prevState) => {
          // TODO: avoid a deep clone
          const newState = utils.deepClone(prevState);
          newState.lastUpdatedTime = new Date().toISOString();
          newState.nonogram.cells[row][col] = newCellState;
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
          gameSessionRef.child(`users/${user.id}/lastActiveTime`).set(new Date().toISOString());
        }
      } else {
        // No need to save cursor state for an offline game
      }
    },
    [gameSessionRef, user]
  );

  // TOOD: handle transaction failures
  const applyGameSessionStateTransaction = useCallback(
    (transactionFn: (state: GameSessionState) => GameSessionState) => {
      if (gameSessionRef) {
        gameSessionRef.transaction((snapshotValue: GameSessionState) => {
          fixGameSessionStateFromFirebaseSnapshot(snapshotValue);
          return transactionFn(snapshotValue);
        });
      } else {
        setGameSessionState((prevState) => transactionFn(utils.deepClone(prevState)));
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

  return (
    <div css={nonogramGameStyle}>
      <NonogramBoard
        nonogram={gameSessionState.nonogram}
        otherUsers={utils.omit(gameSessionState.users, user.id)}
        onCellUpdated={onCellUpdated}
        onCursorPositionChange={onCursorPositionChange}
        undoLastAction={undoLastAction}
        redoAction={redoAction}
        addToActionLog={addToActionLog}
      />
    </div>
  );
}

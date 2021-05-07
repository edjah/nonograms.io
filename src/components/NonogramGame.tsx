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
    numValidActionsInLog: 0,
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
      realtimeDb.goOnline();
    } else {
      realtimeDb.goOffline();
    }
    return realtimeDb.ref(gameSessionId || "fake-offline-game-session");
  }, [gameSessionId]);

  const [gameSessionState, setGameSessionState] = useState<GameSessionState>(() => {
    return getInitialGameSessionState(originalNonogram, user);
  });

  // Set up a listener for changes from Firebase
  useEffect(() => {
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

  // Callback functions that take advantage of the Firebase SDK to update both local state as well
  // as remote state on Firebase.
  const onCellUpdated = useCallback(
    (row: number, col: number, newCellState: CellState) => {
      gameSessionRef.child("lastUpdatedTime").set(new Date().toISOString());
      gameSessionRef.child(`nonogram/cells/${row}/${col}`).set(newCellState);
    },
    [gameSessionRef]
  );

  const onCursorPositionChange = useCallback(
    (x: number, y: number) => {
      gameSessionRef.child(`users/${user.id}/cursor`).set({ x, y });
      gameSessionRef.child(`users/${user.id}/lastActiveTime`).set(new Date().toISOString());
    },
    [gameSessionRef, user]
  );

  // TOOD: handle transaction failures
  const undoLastAction = useCallback(() => {
    gameSessionRef.transaction((snapshotValue: GameSessionState) => {
      fixGameSessionStateFromFirebaseSnapshot(snapshotValue);
      if (snapshotValue.numValidActionsInLog > 0) {
        const actionToUndo = snapshotValue.actionLog[--snapshotValue.numValidActionsInLog];
        for (const { row, col } of actionToUndo.affectedCells) {
          snapshotValue.nonogram.cells[row][col] = actionToUndo.originalCellState;
        }
      }
      return snapshotValue;
    });
  }, [gameSessionRef]);

  const redoAction = useCallback(() => {
    gameSessionRef.transaction((snapshotValue: GameSessionState) => {
      fixGameSessionStateFromFirebaseSnapshot(snapshotValue);
      if (snapshotValue.numValidActionsInLog < snapshotValue.actionLog.length) {
        const actionToRedo = snapshotValue.actionLog[snapshotValue.numValidActionsInLog++];
        for (const { row, col } of actionToRedo.affectedCells) {
          snapshotValue.nonogram.cells[row][col] = actionToRedo.updatedCellState;
        }
      }
      return snapshotValue;
    });
  }, [gameSessionRef]);

  const addToActionLog = useCallback(
    (action: CellUpdateAction) => {
      gameSessionRef.transaction((snapshotValue: GameSessionState) => {
        fixGameSessionStateFromFirebaseSnapshot(snapshotValue);
        snapshotValue.actionLog.splice(snapshotValue.numValidActionsInLog);
        snapshotValue.actionLog.push(action);
        snapshotValue.numValidActionsInLog = snapshotValue.actionLog.length;
        return snapshotValue;
      });
    },
    [gameSessionRef]
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
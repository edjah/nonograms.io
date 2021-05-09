/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { RouteComponentProps } from "react-router";
import { useEffect, useState } from "react";
import { colors } from "src/theme";
import { firebase, firestore, realtimeDb } from "src/firebase";
import { Nonogram } from "src/utils/nonogram_types";
import { Loading } from "src/components/Loading";
import { NonogramGame } from "src/components/NonogramGame";

const gamePageStyle = css`
  .gameTitle {
    font-size: 25px;
    margin-bottom: 5px;
  }

  .gameContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${colors.black};
    border-radius: 3px;
    min-height: 70vh;

    .errorMessage {
      color: ${colors.red};
    }
  }
`;

export function GamePage(props: RouteComponentProps<{ boardId: string; gameSessionId?: string }>) {
  const { history } = props;
  const { boardId } = props.match.params;
  const gameSessionId = new URLSearchParams(props.location.search).get("session");

  const [nonogram, setActiveNonogram] = useState<Nonogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gameSessionRef, setGameSessionRef] = useState<firebase.database.Reference | null>(null);

  // Load the nonogram definition from Firestore.
  useEffect(() => {
    setIsLoading(true);
    setActiveNonogram(null);
    setErrorMessage(null);

    let isRequestedCancelled = false;
    const documentRef = firestore.collection("nonogram-boards").doc(boardId);
    documentRef.get().then((snap) => {
      if (isRequestedCancelled) {
        return;
      }

      const data = snap.data();
      if (!data) {
        setErrorMessage("The nonogram you requested does not exist.");
      } else {
        const parsedNonogram = JSON.parse(data.boardJson);
        parsedNonogram.title = data.title ?? parsedNonogram.title;
        parsedNonogram.secondaryTitle = data.secondaryTitle ?? parsedNonogram.secondaryTitle;
        setActiveNonogram(parsedNonogram);
      }
      setIsLoading(false);
    });

    return () => {
      isRequestedCancelled = true;
    };
  }, [boardId]);

  // Make an initial request to Firebase Realtime to determine if the gameSessionId is valid. If
  // the gameSessionId is invalid, the snapshot we get back will be null. At that point, we just
  // message the user that their ID is invalid and clear it out from the URL.
  useEffect(() => {
    if (!nonogram || !gameSessionId) {
      return;
    }

    setIsLoading(true);
    setGameSessionRef(null);

    let isRequestedCancelled = false;
    const sessionRef = realtimeDb.ref(gameSessionId);
    sessionRef.get().then((snap) => {
      if (isRequestedCancelled) {
        return;
      }

      if (!snap.val()) {
        // TODO: do better than window.alert?
        window.alert("Game session not found.");
        history.replace(`/board/${boardId}`);
      } else {
        setGameSessionRef(sessionRef);
      }
      setIsLoading(false);
    });

    return () => {
      isRequestedCancelled = true;
    };
  }, [nonogram, boardId, gameSessionId, history]);

  return (
    <div css={gamePageStyle}>
      {/* Render the title, but make it hidden while loading so that it still takes up space. */}
      <div className="gameTitle" style={{ visibility: nonogram ? "visible" : "hidden" }}>
        {nonogram ? nonogram.title : "..."}
      </div>
      <div className="gameContainer">
        {isLoading ? (
          <Loading />
        ) : errorMessage ? (
          <div className="errorMessage">{errorMessage}</div>
        ) : nonogram ? (
          <NonogramGame
            boardId={boardId}
            gameSessionId={gameSessionId}
            nonogram={nonogram}
            gameSessionRef={gameSessionRef}
          />
        ) : null}
      </div>
    </div>
  );
}

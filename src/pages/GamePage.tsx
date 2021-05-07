/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { RouteComponentProps } from "react-router";
import { useCallback, useEffect, useState } from "react";
import * as utils from "src/utils/common";
import { colors } from "src/theme";
import { firestore } from "src/firebase";
import { Nonogram } from "src/utils/nonogram_types";
import { Loading } from "src/components/Loading";
import { NonogramBoard } from "src/components/NonogramBoard";

const gamePageStyle = css`
  .boardTitle {
    font-size: 25px;
    margin-bottom: 5px;
  }

  .boardContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${colors.black};
    border-radius: 3px;
    min-height: 75vh;

    .errorMessage {
      color: ${colors.red};
    }
  }
`;

export function GamePage(props: RouteComponentProps<{ boardId: string; gameSessionId?: string }>) {
  const { boardId } = props.match.params;
  // @ts-ignore TODO: use gameSessionId
  const gameSessionId = new URLSearchParams(props.location.search).get("session");

  const [nonogram, setActiveNonogram] = useState<Nonogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // NOTE: keep this in a mind as a way of staring a new collaborative game session
  // props.history.push(`/game/${boardId}/${gameSessionId}`);

  useEffect(() => {
    setIsLoading(true);
    setActiveNonogram(null);
    setErrorMessage(null);
    let isCancelled = false;

    async function loadNonogramAsync() {
      const document = await firestore.collection("nonogram-boards").doc(boardId!).get();
      if (isCancelled) {
        return;
      }

      const data = document.data();
      if (!data) {
        setErrorMessage("The nonogram you requested does not exist.");
      } else {
        setActiveNonogram(JSON.parse(data.boardJson));
      }
      setIsLoading(false);
    }

    loadNonogramAsync();
    return () => {
      isCancelled = true;
    };
  }, [boardId]);

  const onCellUpdated = useCallback((row, col, newCellState) => {
    setActiveNonogram((prevNonogram) => {
      utils.assert(prevNonogram);
      const newNonogram = utils.deepClone(prevNonogram);
      newNonogram.cells[row][col] = newCellState;
      return newNonogram;
    });
  }, []);

  return (
    <div css={gamePageStyle}>
      {/* Render the title, but make it hidden while loading so that it still takes up space. */}
      <div className="boardTitle" style={{ visibility: nonogram ? "visible" : "hidden" }}>
        {nonogram ? nonogram.title : "..."}
      </div>
      <div className="boardContainer">
        {isLoading && <Loading />}
        {errorMessage && <div className="errorMessage">{errorMessage}</div>}
        {nonogram && <NonogramBoard nonogram={nonogram} onCellUpdated={onCellUpdated} />}
      </div>
    </div>
  );
}

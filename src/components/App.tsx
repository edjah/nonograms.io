/** @jsxImportSource @emotion/react */
import { Global, css } from "@emotion/react";
import { useCallback, useEffect, useState } from "react";
import common from "src/static/css/common.css";
import fonts from "src/static/css/fonts.css";
import normalize from "src/static/css/normalize.css";
import { Navbar } from "src/components/Navbar";
import { Sidebar } from "src/components/Sidebar";
import { NonogramBoard } from "src/components/NonogramBoard";
import * as utils from "src/utils/common";
import { firestore } from "src/firebase";
import { Nonogram } from "src/nonogram/nonogram_types";
import { Loading } from "src/components/Loading";
import { colors } from "src/theme";

const appStyle = css`
  .inner-app {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 2fr;

    .boardContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${colors.black};
      border-radius: 3px;

      .errorMessage {
        color: ${colors.red};
      }
    }
  }
`;

export function App() {
  // const [boardId, setBoardId] = useState<string | null>(null);
  const [boardId] = useState<string | null>("EmFdVTknkvhmG7M0tGWs");
  const [activeNonogram, setActiveNonogram] = useState<Nonogram | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      return;
    }
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
    <div css={appStyle}>
      <Global
        styles={css`
          ${normalize.toString()}
          ${fonts.toString()}
          ${common.toString()}
        `}
      />
      <Navbar />
      <div className="inner-app">
        <Sidebar />
        <div className="boardContainer">
          {isLoading && <Loading />}
          {errorMessage && <div className="errorMessage">{errorMessage}</div>}
          {activeNonogram && (
            <NonogramBoard nonogram={activeNonogram} onCellUpdated={onCellUpdated} />
          )}
        </div>
      </div>
    </div>
  );
}

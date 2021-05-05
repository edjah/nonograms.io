/** @jsxImportSource @emotion/react */
import { Global, css } from "@emotion/react";
import { useState } from "react";
import common from "src/static/css/common.css";
import fonts from "src/static/css/fonts.css";
import normalize from "src/static/css/normalize.css";
import { Navbar } from "src/components/Navbar";
import { Sidebar } from "src/components/Sidebar";
import { NonogramBoard } from "src/components/NonogramBoard";

import { generateHumanSolveableNonogram } from "src/nonogram/nonogram_generator";
import * as utils from "src/utils/common";

const appStyle = css`
  .inner-app {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
`;

export function App() {
  // TODO: fix this
  const [activeNonogram, setActiveNonogram] = useState(() => generateHumanSolveableNonogram(10));

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
        <NonogramBoard
          nonogram={activeNonogram}
          onCellUpdated={(row, col, newCellState) => {
            const newNonogram = utils.deepClone(activeNonogram);
            newNonogram.cells[row][col] = newCellState;
            setActiveNonogram(newNonogram);
          }}
        />
      </div>
    </div>
  );
}

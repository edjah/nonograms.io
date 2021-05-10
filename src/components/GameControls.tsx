/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { colors } from "src/theme";
import { Button } from "src/components/Button";
import { SolutionCorrectnessStatus } from "src/utils/nonogram_types";

const gameControlsStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;

  .mistakes {
    color: ${colors.red};
    opacity: 0.7;
    font-size: 0.9em;
    margin-bottom: 8px;
  }

  .progress {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;

    .filledCell {
      background-color: ${colors.gray};
      width: 20px;
      height: 20px;
    }
  }

  .menu {
    display: flex;
    gap: 10px;
  }
`;

export function GameControls(props: {
  solutionStatus: SolutionCorrectnessStatus;
  resetBoard: () => void;
  goToNextLevel?: () => void;
}) {
  const { solutionStatus, resetBoard, goToNextLevel } = props;
  const {
    isSolved,
    numFilledCells,
    totalNumCellsToFill,
    numMistakes,
    isNotCompleteBecauseHasMistakes,
  } = solutionStatus;

  return (
    <div css={gameControlsStyle}>
      <div
        className="mistakes"
        style={{ visibility: isNotCompleteBecauseHasMistakes ? "visible" : "hidden" }}
      >
        {numMistakes === 1 ? "1 line has a mistake" : `${numMistakes} lines have mistakes`}
      </div>
      <div className="progress">
        <div className="filledCell" />
        {numFilledCells}/{totalNumCellsToFill}
      </div>

      <div className="menu">
        <Button
          onClick={() => {
            if (window.confirm("Are you sure you want to reset?")) {
              resetBoard();
            }
          }}
        >
          Reset
        </Button>
        {isSolved && goToNextLevel && <Button onClick={goToNextLevel}>Next Level</Button>}
      </div>
    </div>
  );
}

/** @jsxImportSource @emotion/react */
import { gameLevels } from "src/gameLevels";
import { css } from "@emotion/react";
import { colors } from "src/theme";
import { RouteComponentProps } from "react-router";
import { getLocalGameState } from "src/utils/localStorage";
import { Button } from "src/components/Button";

const homePageStyle = css`
  max-width: 800px;
  margin: 0 auto;

  .levels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 20px;

    > div {
      padding-bottom: 20px;

      &.notStarted {
        :after {
          color: ${colors.gray};
          content: "Not started";
        }
      }

      &.inProgress {
        :after {
          color: ${colors.yellow};
          content: "In progress";
        }
      }

      &.solved {
        :after {
          color: ${colors.green};
          content: "Solved";
        }
      }
    }
  }
`;

export function HomePage(props: RouteComponentProps) {
  return (
    <div css={homePageStyle}>
      <div className="levels">
        {gameLevels.map((level) => {
          const localState = getLocalGameState(level.id);
          return (
            <Button
              key={level.id}
              className={localState?.status ?? "notStarted"}
              onClick={() => {
                props.history.push(`/board/${level.id}`);
              }}
            >
              <h3>{level.title}</h3>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

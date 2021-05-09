/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useHistory } from "react-router";
import { colors } from "src/theme";
import { useMemo } from "react";
import * as utils from "src/utils/common";
import { realtimeDb } from "src/firebase";
import { GameSessionState } from "src/utils/nonogram_types";

const shareLinkStyle = css`
  max-width: 450px;
  margin: 0px auto;
  margin-top: 30px;
  text-align: center;

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
`;

export function ShareLink(props: {
  boardId: string;
  gameSessionId: string | null;
  gameSessionState: GameSessionState;
}) {
  const { boardId, gameSessionId, gameSessionState } = props;
  const history = useHistory();

  // If we're not currently in a session, we will create a new one using this ID.
  const tentativeGameSessionId = useMemo(() => utils.generateRandomBase62String(8), []);
  const shareUrl = `${window.location.origin}/board/${boardId}?session=${
    gameSessionId || tentativeGameSessionId
  }`;

  return (
    <div css={shareLinkStyle}>
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
  );
}

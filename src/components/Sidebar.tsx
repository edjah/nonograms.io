/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

const sidebarStyle = css`
  height: 600px;
  width: 300px;
  border: 1px solid black;
  border-radius: 3px;
  text-align: center;
`;

export function Sidebar() {
  return (
    <div css={sidebarStyle}>
      <h2>TODO: Sidebar</h2>
    </div>
  );
}

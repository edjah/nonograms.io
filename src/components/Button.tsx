/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";
import { colors } from "src/theme";

const buttonStyle = css`
  display: inline-block;
  border: 1px solid ${colors.black};
  border-radius: 3px;
  box-sizing: border-box;
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.2s;

  :hover {
    background-color: ${colors.gray}11; // The '11' sets opacity to 6.6%
  }
`;

export function Button(props: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <div css={buttonStyle} className={props.className} onClick={props.onClick}>
      {props.children}
    </div>
  );
}

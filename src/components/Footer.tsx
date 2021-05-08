/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Link } from "react-router-dom";

const footerStyle = css`
  max-width: 1000px;
  margin: 50px auto;

  display: flex;
  justify-content: center;
  gap: 30px;

  a {
    font-weight: bold;
  }
`;

export function Footer() {
  return (
    <footer css={footerStyle}>
      <Link to="/about/">About</Link>
      <Link to="/help/">Help</Link>
    </footer>
  );
}

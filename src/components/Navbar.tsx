/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import logo from "src/static/images/logo.svg";

// TODO: replace the logo with something that actually makes sense.
// Also potentially consider adding a cool animation to the new logo.
const navbarStyle = css`
  margin-top: 10px;
  margin-bottom: 30px;

  .title {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    height: 40px;

    .logo {
      height: 100%;

      @media (prefers-reduced-motion: no-preference) {
        animation: App-logo-spin infinite 20s linear;
      }

      @keyframes App-logo-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
`;

export function Navbar() {
  return (
    <header css={navbarStyle}>
      <a className="title" href="/">
        <img src={logo} className="logo" alt="Nonograms.io logo" />
        <h1>nonograms.io</h1>
      </a>
    </header>
  );
}

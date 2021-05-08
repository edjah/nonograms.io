/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Logo } from "src/components/Logo";

const navbarStyle = css`
  margin-top: 20px;
  margin-bottom: 30px;

  .title {
    margin-left: 10px;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    height: 40px;
    gap: 5px;

    .logo {
      height: 40px;

      @media (prefers-reduced-motion: no-preference) {
        animation: App-logo-spin infinite 10s linear;
      }

      @keyframes App-logo-spin {
        0% {
          transform: rotate(0deg);
        }
        49.999% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(90deg);
        }
        99.999% {
          transform: rotate(90deg);
        }
        100% {
          transform: rotate(0deg);
        }
      }
    }
  }
`;

export function Navbar() {
  return (
    <header css={navbarStyle}>
      <a className="title" href="/">
        <Logo className="logo" />
        <h1>nonograms.io</h1>
      </a>
    </header>
  );
}

/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Logo } from "src/components/Logo";

const navbarStyle = css`
  margin-top: 20px;
  margin-bottom: 30px;

  .title {
    margin-left: 20px;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    height: 40px;
    gap: 10px;

    h1 {
      font-weight: 300;
      margin-top: 15px;
    }

    .logo {
      height: 100%;
    }
  }
`;

export function Navbar() {
  return (
    <header css={navbarStyle}>
      <a className="title" href="/">
        <Logo className="logo" animationPeriodSeconds={30} />
        <h1>nonograms.io</h1>
      </a>
    </header>
  );
}

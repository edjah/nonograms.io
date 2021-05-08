/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Logo } from "src/components/Logo";

const notFoundPageStyle = css`
  max-width: 600px;
  margin: 50px auto;
  text-align: center;

  .logo {
    margin-top: 20px;
    margin-bottom: 20px;
    max-width: 200px;
  }
`;

export function NotFoundPage() {
  return (
    <div css={notFoundPageStyle}>
      <h1>Page not found</h1>
      <Logo className="logo" animationPeriodSeconds={10} />
    </div>
  );
}

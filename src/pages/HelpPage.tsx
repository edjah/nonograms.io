/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { ExternalLink } from "src/components/ExternalLink";

const helpPageStyle = css`
  max-width: 600px;
  margin: 50px auto;

  h1 {
    margin-bottom: 30px;
  }

  section {
    margin-bottom: 40px;
  }
`;

export function HelpPage() {
  return (
    <div css={helpPageStyle}>
      <h1>Help</h1>
      <section>
        <h2>What is a nonogram?</h2>
        <p>
          <ExternalLink href="https://en.wikipedia.org/wiki/Nonogram">Nonograms</ExternalLink> are
          visual logic puzzles in which a grid of cells must be colored or left blank according to
          the numbers on the side of the grid. They were invented in 1987 by Japanese puzzle makers.
          When a nonogram is solved, it will reveal a hidden image!
          {/* TODO: insert surprised pikachu nonogram */}
        </p>
      </section>
      <section>
        <h2>How do I solve a nonogram?</h2>
        <p>Getting started with nonograms is easy. There are just a few basic rules.</p>
      </section>
      <h1>TODO: finish this page</h1>
    </div>
  );
}

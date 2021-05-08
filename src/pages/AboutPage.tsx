/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Link } from "react-router-dom";
import { ExternalLink } from "src/components/ExternalLink";

const aboutPageStyle = css`
  max-width: 600px;
  margin: 50px auto;
`;

export function AboutPage() {
  return (
    <div css={aboutPageStyle}>
      <h1>About</h1>
      <p>
        <Link to="/">
          <strong>nonograms.io</strong>
        </Link>{" "}
        was developed by <ExternalLink href="https://github.com/edjah">Nenya Edjah</ExternalLink> as
        a result of a desire to play a fun logic-based puzzle game with his friends. Some of the
        design and ideas for this site were inspired by sites like{" "}
        <ExternalLink href="https://setwithfriends.com/">Set with Friends</ExternalLink> and{" "}
        <ExternalLink href="https://downforacross.com/beta">Down for a Cross</ExternalLink>. The
        source code that runs nonograms.io is freely available on{" "}
        <ExternalLink href="https://github.com/edjah/nonograms.io">GitHub</ExternalLink>.
      </p>
      <p>
        If you have any questions, comments, or suggestions, please{" "}
        <ExternalLink href="https://github.com/edjah/nonograms.io/issues">
          file an issue
        </ExternalLink>{" "}
        on GitHub or consider making a pull request. Alternatively, you can email me at{" "}
        <a href="mailto:nenya@nonograms.io">nenya@nonograms.io</a>.
      </p>
    </div>
  );
}

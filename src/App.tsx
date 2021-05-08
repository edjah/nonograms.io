/** @jsxImportSource @emotion/react */
import { Global, css } from "@emotion/react";
import { Route, Switch } from "react-router-dom";
import common from "src/static/css/common.css";
import normalize from "src/static/css/normalize.css";
import { Navbar } from "src/components/Navbar";
import { Footer } from "src/components/Footer";
import { HelpPage } from "src/pages/HelpPage";
import { AboutPage } from "src/pages/AboutPage";
import { GamePage } from "src/pages/GamePage";
import { NotFoundPage } from "src/pages/NotFoundPage";
import { HomePage } from "src/pages/HomePage";

const appStyle = css`
  .inner-app {
    padding-left: 30px;
    padding-right: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }
`;

export function App() {
  return (
    <div css={appStyle}>
      <Global
        styles={css`
          ${normalize.toString()}
          ${common.toString()}
        `}
      />
      <Navbar />
      <div className="inner-app">
        <Switch>
          <Route path="/" component={HomePage} exact />
          <Route path="/help" component={HelpPage} exact />
          <Route path="/about" component={AboutPage} exact />
          <Route path="/game/:boardId/" component={GamePage} exact />
          <Route path="*" component={NotFoundPage} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

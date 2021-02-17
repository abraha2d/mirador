import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import LiveView from "components/LiveView";
import PlaybackView from "components/PlaybackView";
import TopNav from "components/TopNav";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="h-100 d-flex flex-column">
        <TopNav />
        <Switch>
          <Route path="/playback">
            <PlaybackView />
          </Route>
          <Route path="/" exact>
            <LiveView />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;

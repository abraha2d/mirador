import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import LiveView from "components/LiveView";
import PlaybackView from "components/PlaybackView";
import Store from "components/Store";
import TopNav from "components/TopNav";

import "./App.css";

export const App = () => (
  <Store>
    <Router>
      <DndProvider backend={HTML5Backend}>
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
      </DndProvider>
    </Router>
  </Store>
);

export default App;

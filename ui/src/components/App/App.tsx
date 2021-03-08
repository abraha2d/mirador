import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { LiveView, Store, TopNav } from "components";

import "./App.css";

export const App = () => (
  <Store>
    <Router>
      <DndProvider backend={HTML5Backend}>
        <div className="h-100 d-flex flex-column">
          <TopNav />
          <Switch>
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

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DndProvider } from "react-dnd-multi-backend";

import { LiveView, Store, TopNav } from "components";
import { HTML5toTouch } from "./utils";
import "./App.css";

export const App = () => (
  <Store>
    <BrowserRouter>
      <DndProvider options={HTML5toTouch}>
        <div className="h-100 d-flex flex-column">
          <TopNav />
          <Routes>
            <Route path="/" Component={LiveView} />
          </Routes>
        </div>
      </DndProvider>
    </BrowserRouter>
  </Store>
);

export default App;

import React from "react";
import ReactDOM from "react-dom";

import { App, Store } from "components";

import "bootstrap/dist/css/bootstrap.css";
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <Store>
      <App />
    </Store>
  </React.StrictMode>,
  document.getElementById("root")
);

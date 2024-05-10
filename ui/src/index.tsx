import React from "react";
import { createRoot } from "react-dom/client";

import { App, Store } from "components";

import "bootstrap/dist/css/bootstrap.css";
import "./index.css";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Store>
      <App />
    </Store>
  </React.StrictMode>
);

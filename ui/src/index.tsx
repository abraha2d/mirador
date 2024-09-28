import React from "react";
import { createRoot } from "react-dom/client";

import { App, Store } from "components";

import "bootstrap/dist/css/bootstrap.css";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Store>
        <App/>
      </Store>
    </React.StrictMode>,
  );
} else {
  console.error("Could not find #root")
}

if (process.env.NODE_ENV === "development") {
  new EventSource("/esbuild").addEventListener("change", (e) => {
    const { added, removed, updated } = JSON.parse(e.data);

    if (!added.length && !removed.length && updated.length === 1) {
      for (const link of document.getElementsByTagName("link")) {
        const url = new URL(link.href);

        if (url.host === location.host && url.pathname === updated[0]) {
          const next = link.cloneNode();
          next.href = `${updated[0]}?${Math.random().toString(36).slice(2)}`;
          next.onload = () => link.remove();
          link.parentNode.insertBefore(next, link.nextSibling);
          return;
        }
      }
    }

    location.reload();
  });
}

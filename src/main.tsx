import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/roboto"; // Defaults to weight 400
import "@fontsource/roboto/400.css"; // Specify weight
import "@fontsource/roboto/400-italic.css"; // Specify weight and style

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.Fragment>
    <App />
  </React.Fragment>
);

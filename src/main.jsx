import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { FileSelectionProvider } from "./contexts/FileSelectionContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <ThemeProvider>
        <FileSelectionProvider>
          <App />
        </FileSelectionProvider>
      </ThemeProvider>
    </ToastProvider>
  </React.StrictMode>,
);

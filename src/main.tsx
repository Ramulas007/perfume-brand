import "./instrument";

import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ padding: 24, textAlign: "center", fontFamily: "system-ui" }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please refresh the page.</p>
        </div>
      }
    >
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

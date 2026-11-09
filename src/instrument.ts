import React from "react";
import * as Sentry from "@sentry/react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const DSN =
  (import.meta.env.VITE_SENTRY_DSN as string | undefined) ||
  "https://f2c4c6fe08a6c3517fb6c6fccac64302@o4511683018031104.ingest.de.sentry.io/4511683030286416";

Sentry.init({
  dsn: DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

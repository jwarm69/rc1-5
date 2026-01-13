import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnv } from "./lib/env";
import { initSentry } from "./lib/sentry";

// Validate environment variables at startup
validateEnv();

// Initialize Sentry error tracking (if configured)
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

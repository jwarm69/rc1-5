/**
 * Sentry Error Tracking Integration
 *
 * This module provides error tracking and monitoring via Sentry.
 * Sentry must be configured with a DSN in the environment variables.
 *
 * Setup:
 * 1. Create a Sentry project at sentry.io
 * 2. Add VITE_SENTRY_DSN to your .env file
 * 3. Call initSentry() in main.tsx before rendering
 *
 * Environment Variables:
 * - VITE_SENTRY_DSN: Your Sentry project DSN
 * - VITE_SENTRY_ENVIRONMENT: 'development' | 'staging' | 'production'
 */

// NOTE: Install @sentry/react when ready:
// npm install @sentry/react

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
}

interface UserContext {
  id: string;
  email?: string;
}

// Sentry instance placeholder - will be set after initialization
let sentryInstance: typeof import("@sentry/react") | null = null;

/**
 * Check if Sentry is configured
 */
export function isSentryConfigured(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
}

/**
 * Initialize Sentry error tracking
 * Call this once in main.tsx before rendering
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log("Sentry DSN not configured - error tracking disabled");
    return;
  }

  try {
    // Dynamic import to avoid bundling Sentry if not configured
    const Sentry = await import("@sentry/react");
    sentryInstance = Sentry;

    const config: SentryConfig = {
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "development",
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    };

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      tracesSampleRate: config.tracesSampleRate,
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration(),
        // Replay for session recordings (optional)
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Only capture errors in production
      beforeSend(event) {
        // Filter out development errors if needed
        if (import.meta.env.DEV) {
          console.log("Sentry event (dev mode):", event);
        }
        return event;
      },
    });

    console.log("Sentry initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Set the current user context
 * Call this after user authentication
 */
export function setUser(user: UserContext | null): void {
  if (!sentryInstance) return;

  if (user) {
    sentryInstance.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    sentryInstance.setUser(null);
  }
}

/**
 * Capture an exception and send to Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!sentryInstance) {
    console.error("Error (Sentry not initialized):", error);
    return;
  }

  sentryInstance.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!sentryInstance) {
    console.log(`[${level}] ${message}`);
    return;
  }

  sentryInstance.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging context
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "info" | "warning" | "error";
  data?: Record<string, unknown>;
}): void {
  if (!sentryInstance) return;

  sentryInstance.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
  });
}

/**
 * Set custom tags for filtering in Sentry dashboard
 */
export function setTag(key: string, value: string): void {
  if (!sentryInstance) return;
  sentryInstance.setTag(key, value);
}

/**
 * Error handler for ErrorBoundary integration
 * Pass this to ErrorBoundary's onError prop
 */
export function handleBoundaryError(error: Error, errorInfo: { componentStack: string }): void {
  captureException(error, {
    componentStack: errorInfo.componentStack,
  });
}

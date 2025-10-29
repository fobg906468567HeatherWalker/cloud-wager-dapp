/**
 * Error Boundary Component
 *
 * Catches React errors and displays user-friendly error UI
 * Prevents entire app from crashing due to component errors
 *
 * Features:
 * - Catches and displays React errors
 * - Provides error recovery options
 * - Logs errors for debugging
 * - Responsive design
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */

import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react";

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Class Component
 * Must be a class component as React doesn't support error boundaries in functional components yet
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details and call custom error handler
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state to retry rendering
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the entire page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate to home page
   */
  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription className="mt-1">
                    The application encountered an unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Details (development only) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <div>
                        <strong className="font-semibold">Error:</strong>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong className="font-semibold">Component Stack:</strong>
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* User-friendly error message */}
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="text-muted-foreground">
                  Don't worry! Here are some things you can try:
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Try refreshing the page</li>
                  <li>Check your wallet connection</li>
                  <li>Make sure you're on the Sepolia network</li>
                  <li>Clear your browser cache</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex-1" variant="default">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} className="flex-1" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Support Info */}
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  If this problem persists, please{" "}
                  <a
                    href="https://github.com/your-repo/issues"
                    className="underline hover:text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    report an issue
                  </a>{" "}
                  with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error display component
 * For use outside of Error Boundary
 *
 * @example
 * ```tsx
 * {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
 * ```
 */
export function ErrorDisplay({
  error,
  onRetry,
  title = "Error",
}: {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-5 w-5" />
      <div className="ml-3 flex-1">
        <h4 className="font-semibold">{title}</h4>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-3">{errorMessage}</p>
          {onRetry && (
            <Button onClick={onRetry} size="sm" variant="outline" className="bg-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}

/**
 * Error message for empty states
 *
 * @example
 * ```tsx
 * {data.length === 0 && <EmptyState message="No forecasts found" />}
 * ```
 */
export function EmptyState({
  icon: Icon = AlertCircle,
  title = "No data found",
  message,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="my-8">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}

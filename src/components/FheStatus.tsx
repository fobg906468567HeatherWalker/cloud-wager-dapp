/**
 * FHE Status Components
 *
 * Visual indicators for FHE SDK initialization status
 * Provides user feedback during encryption/decryption operations
 *
 * Features:
 * - Real-time initialization status tracking
 * - Loading states with progress indicators
 * - Error messages with retry functionality
 * - Responsive design
 */

import { useEffect, useState } from "react";
import { getFheState, onFheStateChange, ensureFheInstance, type FheInitState } from "@/lib/fhe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Hook to track FHE initialization state
 * Subscribes to state changes and updates component
 */
export function useFheStatus() {
  const [state, setState] = useState<FheInitState>(getFheState());

  useEffect(() => {
    const unsubscribe = onFheStateChange(setState);
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Full-screen FHE initialization loading overlay
 * Shows when FHE SDK is initializing for the first time
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <FheInitOverlay />
 *       <YourContent />
 *     </>
 *   );
 * }
 * ```
 */
export function FheInitOverlay() {
  const state = useFheStatus();

  if (state.status !== "initializing") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="max-w-md p-8 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <Shield className="h-16 w-16 text-primary" />
            <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary/30" />
          </div>
        </div>
        <h3 className="mb-2 text-xl font-semibold">Initializing FHE Encryption</h3>
        <p className="text-sm text-muted-foreground">
          Loading cryptographic modules for privacy-preserving operations...
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>This may take a few seconds</span>
        </div>
      </Card>
    </div>
  );
}

/**
 * Inline FHE status indicator
 * Shows current FHE state without blocking UI
 *
 * @example
 * ```tsx
 * function Form() {
 *   return (
 *     <div>
 *       <FheStatusBadge />
 *       <input ... />
 *       <button>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function FheStatusBadge() {
  const state = useFheStatus();

  if (state.status === "idle" || state.status === "ready") {
    return null;
  }

  const statusConfig = {
    initializing: {
      icon: Loader2,
      text: "Initializing encryption...",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      iconClassName: "animate-spin",
    },
    error: {
      icon: AlertCircle,
      text: "Encryption unavailable",
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      iconClassName: "",
    },
  };

  const config = statusConfig[state.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${config.iconClassName}`} />
      <span>{config.text}</span>
    </div>
  );
}

/**
 * FHE error alert with retry functionality
 * Displays when FHE initialization fails
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <FheErrorAlert />
 *       <YourContent />
 *     </div>
 *   );
 * }
 * ```
 */
export function FheErrorAlert() {
  const state = useFheStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  if (state.status !== "error") {
    return null;
  }

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await ensureFheInstance();
    } catch (error) {
      // Error will be handled by FHE state management
      console.error("FHE retry failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Encryption System Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3 text-sm">
          {state.error || "Failed to initialize FHE encryption system."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="sm"
            variant="outline"
            className="bg-white text-destructive hover:bg-destructive hover:text-white"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              "Retry Initialization"
            )}
          </Button>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
            className="bg-white text-destructive hover:bg-destructive hover:text-white"
          >
            Reload Page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Compact FHE status indicator with icon
 * Perfect for toolbars and headers
 *
 * @example
 * ```tsx
 * <header>
 *   <Logo />
 *   <FheStatusIcon />
 *   <ConnectButton />
 * </header>
 * ```
 */
export function FheStatusIcon() {
  const state = useFheStatus();

  const statusConfig = {
    idle: { icon: Shield, color: "text-gray-400", tooltip: "FHE not initialized" },
    initializing: { icon: Loader2, color: "text-blue-500 animate-spin", tooltip: "Initializing FHE..." },
    ready: { icon: CheckCircle2, color: "text-green-500", tooltip: "FHE ready" },
    error: { icon: AlertCircle, color: "text-red-500", tooltip: "FHE error" },
  };

  const config = statusConfig[state.status];
  const Icon = config.icon;

  return (
    <div className="relative group" title={config.tooltip}>
      <Icon className={`h-5 w-5 ${config.color}`} />
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
          {config.tooltip}
        </div>
      </div>
    </div>
  );
}

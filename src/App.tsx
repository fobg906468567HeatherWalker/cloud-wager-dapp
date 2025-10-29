/**
 * Main App Component
 *
 * Configures all providers for the WeatherWager DApp:
 * - Error Boundary (Error handling)
 * - Wagmi (Web3 interactions)
 * - RainbowKit (Wallet connection UI) - Coinbase disabled in wagmi config
 * - React Query (Data fetching)
 * - Router (Navigation)
 * - UI Toast notifications
 * - Network Guard (Ensures correct network)
 * - FHE Status (Encryption initialization feedback)
 *
 * Architecture:
 * 1. ErrorBoundary wraps entire app for crash recovery
 * 2. Web3 providers (Wagmi + RainbowKit)
 * 3. React Query for data caching
 * 4. Router for page navigation
 * 5. UI providers (Tooltip, Toast)
 * 6. Global guards (Network, FHE)
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// Pages
import Index from "./pages/Index";
import WeatherDApp from "./pages/WeatherDApp";
import WeatherHistory from "./pages/WeatherHistory";
import NotFound from "./pages/NotFound";

// Configuration
import { wagmiConfig } from "@/lib/wagmi";

// Components
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkGuard } from "@/components/NetworkGuard";
import { FheInitOverlay, FheErrorAlert } from "@/components/FheStatus";

// ===========================
// React Query Configuration
// ===========================

/**
 * React Query client with optimized defaults
 * - 1 minute stale time for better caching
 * - Disabled window focus refetching
 * - 3 retry attempts for failed queries
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // Consider data fresh for 1 minute
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
});

// ===========================
// RainbowKit Theme
// ===========================

/**
 * Custom RainbowKit theme matching app colors
 */
const rainbowKitTheme = lightTheme({
  accentColor: "#0EA5E9", // Sky blue primary color
  accentColorForeground: "white",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

// ===========================
// Main App Component
// ===========================

/**
 * Root App Component
 *
 * Provider hierarchy:
 * 1. ErrorBoundary - Catches React errors
 * 2. WagmiProvider - Web3 wallet connection
 * 3. QueryClientProvider - Data fetching and caching
 * 4. RainbowKitProvider - Wallet UI
 * 5. TooltipProvider - Tooltip accessibility
 * 6. BrowserRouter - Routing
 *
 * Global Components:
 * - NetworkGuard - Shows warning on wrong network
 * - FheInitOverlay - Shows loading during FHE initialization
 * - FheErrorAlert - Shows error if FHE fails to initialize
 * - Toaster - Toast notifications
 *
 * @note Coinbase connector is disabled in wagmi.ts configuration
 * @note FHE SDK is loaded via CDN in index.html
 */
const App = () => {
  // Log app initialization
  console.log("[App] WeatherWager initializing...");

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors for monitoring/debugging
        console.error("[App] Caught error:", error);
        console.error("[App] Error info:", errorInfo);

        // TODO: Send to error monitoring service (e.g., Sentry)
        // Sentry.captureException(error, { contexts: { react: errorInfo } });
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={rainbowKitTheme}>
            <TooltipProvider delayDuration={300}>
              {/* Network Status Guard - Shows warning if on wrong network */}
              <NetworkGuard />

              {/* FHE Initialization Overlay - Blocks UI during encryption setup */}
              <FheInitOverlay />

              {/* Toast Notifications */}
              <Toaster />
              <Sonner position="top-center" />

              {/* Main Application Router */}
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  {/* FHE Error Alert - Shows if encryption fails */}
                  <div className="container mx-auto px-4 py-4">
                    <FheErrorAlert />
                  </div>

                  {/* Page Routes */}
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/app" element={<WeatherDApp />} />
                    <Route path="/app/history" element={<WeatherHistory />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  );
};

export default App;

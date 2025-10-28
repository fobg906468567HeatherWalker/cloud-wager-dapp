/**
 * Main App Component
 *
 * Configures all providers for the WeatherWager DApp:
 * - Wagmi (Web3 interactions)
 * - RainbowKit (Wallet connection UI) - Coinbase disabled in wagmi config
 * - React Query (Data fetching)
 * - Router (Navigation)
 * - UI Toast notifications
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiConfig } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import Index from "./pages/Index";
import WeatherDApp from "./pages/WeatherDApp";
import WeatherHistory from "./pages/WeatherHistory";
import NotFound from "./pages/NotFound";
import { wagmiConfig } from "@/lib/wagmi";

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Root App Component
 * Note: Coinbase connector is disabled in wagmi.ts configuration
 */
const App = () => (
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider
      theme={lightTheme({
        accentColor: "#0EA5E9",
        accentColorForeground: "white",
        borderRadius: "medium",
      })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/app" element={<WeatherDApp />} />
              <Route path="/app/history" element={<WeatherHistory />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </RainbowKitProvider>
  </WagmiConfig>
);

export default App;

/**
 * NetworkGuard Component
 *
 * Ensures user is connected to the correct network (Sepolia)
 * Shows a warning banner when user is on wrong network
 * Provides network switching functionality
 *
 * Features:
 * - Automatic network detection
 * - One-click network switching
 * - Responsive design
 * - Clear user feedback
 */

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Network } from "lucide-react";

/**
 * Network guard component that warns users if they're on the wrong network
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <NetworkGuard />
 *       <YourDAppContent />
 *     </>
 *   );
 * }
 * ```
 */
export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Only show warning if wallet is connected and on wrong network
  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  if (!isWrongNetwork) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full">
      <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="font-semibold">Wrong Network Detected</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm">
            WeatherWager requires Sepolia testnet. Please switch networks to continue.
          </span>
          <Button
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isPending}
            size="sm"
            variant="outline"
            className="bg-white text-destructive hover:bg-destructive hover:text-white shrink-0"
          >
            <Network className="mr-2 h-4 w-4" />
            {isPending ? "Switching..." : "Switch to Sepolia"}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Inline network status indicator for use in headers/navbars
 *
 * @example
 * ```tsx
 * <header>
 *   <Logo />
 *   <NetworkStatusBadge />
 *   <ConnectButton />
 * </header>
 * ```
 */
export function NetworkStatusBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return null;
  }

  const isCorrectNetwork = chainId === sepolia.id;

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        isCorrectNetwork
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      }`}
    >
      <div
        className={`h-2 w-2 rounded-full ${
          isCorrectNetwork ? "bg-green-600" : "bg-red-600"
        }`}
      />
      <span className="hidden sm:inline">
        {isCorrectNetwork ? "Sepolia" : "Wrong Network"}
      </span>
    </div>
  );
}

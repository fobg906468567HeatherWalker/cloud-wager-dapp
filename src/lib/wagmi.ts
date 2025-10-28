/**
 * Wagmi and RainbowKit Configuration
 *
 * This module configures Web3 wallet connectivity for the WeatherWager DApp.
 *
 * Key Features:
 * - Sepolia testnet configuration
 * - RainbowKit wallet connectors (MetaMask, WalletConnect, Rainbow)
 * - Coinbase connector is DISABLED to avoid connection issues
 * - HTTP transport with public RPC endpoints
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

// Environment variables for configuration
const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id';
const APP_NAME = 'WeatherWager';

/**
 * Wagmi Configuration
 *
 * Uses RainbowKit's getDefaultConfig for easy setup with pre-configured connectors.
 * Coinbase connector is excluded to prevent connection issues.
 */
export const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID,

  // Only Sepolia testnet for FHE development
  chains: [sepolia],

  // Use public RPC endpoints with HTTP transport
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },

  // SSR support (important for Next.js, harmless for Vite)
  ssr: false,
});

/**
 * Sepolia Chain Configuration
 * Export for use in other modules
 */
export { sepolia };

/**
 * Contract deployment addresses
 * These will be set after contract deployment
 */
export const CONTRACTS = {
  WEATHER_WAGER: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined,
} as const;

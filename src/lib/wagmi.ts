/**
 * Wagmi and RainbowKit Configuration
 *
 * This module configures Web3 wallet connectivity for the WeatherWager DApp.
 *
 * Key Features:
 * - Sepolia testnet configuration
 * - RainbowKit wallet connectors with Coinbase explicitly DISABLED
 * - Custom connector list: MetaMask, WalletConnect, Rainbow, Injected wallets
 * - HTTP transport with reliable public RPC endpoints
 * - Network switching support
 */

import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  injectedWallet
} from '@rainbow-me/rainbowkit/wallets';

// ===========================
// Environment Configuration
// ===========================

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id';
const APP_NAME = 'WeatherWager';
const APP_DESCRIPTION = 'Privacy-Preserving Weather Prediction Market';
const APP_URL = 'https://weatherwager.app';
const APP_ICON = '/logo.png'; // Will be updated with project logo

// ===========================
// Wallet Connectors Setup
// ===========================

/**
 * Custom wallet list with Coinbase explicitly excluded
 * Only includes reliable connectors that work well with FHE operations
 */
const connectors = getDefaultWallets({
  appName: APP_NAME,
  projectId: PROJECT_ID,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,      // Most popular and tested
        rainbowWallet,       // RainbowKit's native wallet
        walletConnectWallet, // WalletConnect protocol support
        injectedWallet,      // Support for other injected wallets (Trust, Brave, etc.)
      ],
    },
  ],
});

// ===========================
// Wagmi Configuration
// ===========================

/**
 * Main Wagmi configuration for Web3 interactions
 *
 * @note Coinbase Wallet connector is intentionally excluded from the wallet list
 *       to avoid connection issues with FHE operations and inconsistent behavior
 *
 * @see https://www.rainbowkit.com/docs/custom-wallet-list for custom wallet configuration
 */
export const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID,

  // Only Sepolia testnet for FHE development
  // Zama FHE is currently only available on Sepolia
  chains: [sepolia],

  // Use reliable public RPC endpoints with HTTP transport
  // Multiple fallback URLs can be added for better reliability
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com', {
      timeout: 30_000, // 30 second timeout for FHE operations
      retryCount: 3,   // Retry failed requests 3 times
    }),
  },

  // SSR support disabled for Vite (set to true for Next.js)
  ssr: false,

  // Custom wallet connectors (Coinbase excluded)
  ...connectors,
});

// ===========================
// Chain Configuration
// ===========================

/**
 * Sepolia Chain Configuration
 * Export for use in other modules (viem clients, etc.)
 */
export { sepolia };

/**
 * Chain metadata for better UX
 */
export const CHAIN_METADATA = {
  [sepolia.id]: {
    name: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorer: 'https://sepolia.etherscan.io',
    faucet: 'https://sepoliafaucet.com',
  },
} as const;

// ===========================
// Contract Addresses
// ===========================

/**
 * Deployed contract addresses
 * Set via environment variables after deployment
 */
export const CONTRACTS = {
  WEATHER_WAGER: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined,
} as const;

// ===========================
// Network Utilities
// ===========================

/**
 * Check if user is on the correct network
 * @param chainId - Current chain ID from wagmi
 * @returns boolean - true if on Sepolia, false otherwise
 */
export function isCorrectNetwork(chainId: number | undefined): boolean {
  return chainId === sepolia.id;
}

/**
 * Get network name for display
 * @param chainId - Chain ID to get name for
 * @returns string - Network name or "Unknown"
 */
export function getNetworkName(chainId: number | undefined): string {
  if (!chainId) return 'Unknown';
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA]?.name || 'Unknown Network';
}

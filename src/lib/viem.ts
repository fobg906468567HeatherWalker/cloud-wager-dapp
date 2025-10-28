/**
 * Viem Client Configuration
 *
 * Provides configured Viem clients for reading from and writing to the blockchain
 */

import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from './config';

/**
 * Public Client for reading blockchain data
 * Used for contract reads, event queries, etc.
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

/**
 * Create a wallet client for writing transactions
 * This requires the browser wallet (e.g., MetaMask) to be connected
 *
 * @returns Wallet client or null if no wallet is available
 */
export function getWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  return createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}

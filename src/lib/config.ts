/**
 * Application Configuration
 *
 * Centralized configuration for the WeatherWager DApp
 * All environment variables and constants are defined here
 */

// Contract Configuration
export const WEATHER_WAGER_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

// FHE Configuration
export const WEATHER_WAGER_SCALE = BigInt(1_000_000); // Scale factor used in contract for fixed-point arithmetic

// Network Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

// WalletConnect Configuration
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id';

// Application Metadata
export const APP_NAME = 'WeatherWager';
export const APP_DESCRIPTION = 'Predict tomorrow\'s weather with privacy-preserving technology';

// FHE Gateway Configuration (for Sepolia testnet)
export const FHE_GATEWAY_URL = 'https://gateway.sepolia.zama.ai';
export const FHE_KMS_CONTRACT = '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC';
export const FHE_ACL_CONTRACT = '0x687820221192C5B662b25367F70076A37bc79b6c';

// Weather Condition Constants
export const WEATHER_CONDITIONS = {
  SUNNY: 0,
  RAINY: 1,
  SNOWY: 2,
  CLOUDY: 3,
} as const;

// City IDs (based on major world cities)
export const CITIES = {
  NEW_YORK: 1,
  LONDON: 2,
  TOKYO: 3,
  PARIS: 4,
  SYDNEY: 5,
  DUBAI: 6,
  SINGAPORE: 7,
  SHANGHAI: 8,
} as const;

// Minimum and maximum stake amounts (in ETH)
export const MIN_STAKE_ETH = '0.001';
export const MAX_STAKE_ETH = '1.0';

// Transaction Configuration
export const DEFAULT_GAS_LIMIT = 1_000_000n; // FHE operations require higher gas
export const TRANSACTION_CONFIRMATIONS = 1; // Number of confirmations to wait for

// Time Configuration
export const MARKET_LOCK_DURATION = 24 * 60 * 60; // 24 hours in seconds
export const SETTLEMENT_DELAY = 2 * 60 * 60; // 2 hours after lock time

// UI Configuration
export const TOAST_DURATION = 5000; // Toast notification duration in ms
export const REFETCH_INTERVAL = 30000; // Data refetch interval in ms

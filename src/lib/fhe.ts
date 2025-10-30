/**
 * FHE SDK Initialization and Encryption Utilities
 *
 * This module provides FHE (Fully Homomorphic Encryption) functionality for the WeatherWager DApp.
 * Using CDN-loaded UMD build for simplified WASM handling.
 *
 * Key Features:
 * - Lazy initialization of FHE SDK with automatic retry logic
 * - CDN UMD-based loading (loaded via script tag in index.html)
 * - Singleton pattern to prevent multiple initializations
 * - Comprehensive error handling and user-friendly error messages
 * - Type-safe encryption functions for weather forecasts
 * - Initialization state tracking for UI feedback
 * - Uses hexlify for proper byte-to-hex conversion (following PriceGuess best practices)
 *
 * @see https://docs.zama.ai/fhevm for FHE documentation
 */

import { hexlify } from 'ethers';

// ===========================
// Type Declarations
// ===========================

/**
 * Global window interface for CDN-loaded Zama FHE SDK
 * The SDK is loaded via script tag in index.html
 */
declare global {
  interface Window {
    relayerSDK: {
      initSDK: () => Promise<void>;
      createInstance: (config: SepoliaConfigType) => Promise<FheInstance>;
      SepoliaConfig: SepoliaConfigType; // Built-in config (may be outdated)
    };
  }
}

/**
 * NOTE: We use the SDK's built-in SepoliaConfig instead of defining our own.
 * This is because the SDK's config has the actually-deployed contract addresses on Sepolia,
 * while @fhevm/solidity@0.8.0's ZamaConfig has newer addresses that aren't fully deployed yet.
 */

/**
 * FHE Instance type (from SDK)
 * Contains methods for creating encrypted inputs
 */
interface FheInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
}

/**
 * Builder for encrypted inputs
 */
interface EncryptedInputBuilder {
  add8: (value: number) => EncryptedInputBuilder;
  add64: (value: bigint) => EncryptedInputBuilder;
  encrypt: () => Promise<{
    handles: `0x${string}`[];
    inputProof: `0x${string}`;
  }>;
}

/**
 * Initialization state for UI feedback
 */
export type FheInitState =
  | { status: 'idle' }
  | { status: 'initializing' }
  | { status: 'ready' }
  | { status: 'error'; error: string };

// ===========================
// Module State
// ===========================

let fheInstance: FheInstance | null = null;
let initPromise: Promise<FheInstance> | null = null;
let initState: FheInitState = { status: 'idle' };
let stateChangeListeners: ((state: FheInitState) => void)[] = [];

// ===========================
// Constants
// ===========================

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const INIT_TIMEOUT_MS = 60000; // 60 seconds

// ===========================
// State Management
// ===========================

/**
 * Update initialization state and notify listeners
 */
function setInitState(state: FheInitState) {
  initState = state;
  stateChangeListeners.forEach(listener => listener(state));
}

/**
 * Subscribe to FHE initialization state changes
 * Useful for showing loading spinners in UI
 *
 * @param listener - Callback function to be called on state change
 * @returns Unsubscribe function
 */
export function onFheStateChange(listener: (state: FheInitState) => void): () => void {
  stateChangeListeners.push(listener);
  listener(initState); // Immediately call with current state

  return () => {
    stateChangeListeners = stateChangeListeners.filter(l => l !== listener);
  };
}

/**
 * Get current FHE initialization state
 * @returns Current initialization state
 */
export function getFheState(): FheInitState {
  return initState;
}

// ===========================
// Utility Functions
// ===========================

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a function with timeout
 * @param fn - Async function to run
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects on timeout
 */
async function withTimeout<T>(fn: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  );
  return Promise.race([fn, timeoutPromise]);
}

// ===========================
// Core Initialization
// ===========================

/**
 * Initialize FHE SDK with retry logic
 * Internal function - use ensureFheInstance() instead
 *
 * @param attempt - Current attempt number
 * @returns Promise<FHE Instance>
 * @throws Error if initialization fails after all retries
 */
async function initializeFheWithRetry(attempt: number = 1): Promise<FheInstance> {
  try {
    // Verify CDN script loaded the SDK globally
    if (typeof window === 'undefined' || !window.relayerSDK) {
      throw new Error(
        'FHE SDK not loaded from CDN. Ensure the script tag is present in index.html:\n' +
        '<script src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"></script>'
      );
    }

    console.log(`[FHE] Initialization attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
    const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;

    // Initialize WASM module with timeout
    console.log('[FHE] Initializing WASM runtime...');
    await withTimeout(initSDK(), INIT_TIMEOUT_MS);
    console.log('[FHE] ✓ WASM runtime ready');

    // Create FHE instance with SDK's built-in Sepolia configuration
    // This uses the actually-deployed Sepolia contracts
    console.log('[FHE] Creating FHE instance with SepoliaConfig...');
    const instance = await withTimeout(createInstance(SepoliaConfig), INIT_TIMEOUT_MS);
    console.log('[FHE] ✓ FHE instance ready');

    return instance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[FHE] Initialization attempt ${attempt} failed:`, errorMessage);

    // Retry if we haven't exceeded max attempts
    if (attempt < MAX_RETRY_ATTEMPTS) {
      console.log(`[FHE] Retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
      return initializeFheWithRetry(attempt + 1);
    }

    // All retries failed
    throw new Error(
      `Failed to initialize FHE SDK after ${MAX_RETRY_ATTEMPTS} attempts. ${errorMessage}`
    );
  }
}

/**
 * Ensure FHE instance is initialized and ready
 * Uses CDN-loaded UMD build for simplified WASM handling
 *
 * This function:
 * - Returns immediately if already initialized
 * - Waits for ongoing initialization if in progress
 * - Starts new initialization with retry logic if needed
 * - Updates state for UI feedback
 *
 * @returns Promise<FHE Instance> - The initialized FHE instance
 * @throws Error if initialization fails after retries
 *
 * @example
 * ```typescript
 * try {
 *   const fhe = await ensureFheInstance();
 *   const input = fhe.createEncryptedInput(contractAddr, userAddr);
 *   // ... use FHE instance
 * } catch (error) {
 *   console.error('FHE initialization failed:', error);
 *   // Show error to user
 * }
 * ```
 */
export async function ensureFheInstance(): Promise<FheInstance> {
  // Return existing instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Using cached instance');
    return fheInstance;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    console.log('[FHE] Initialization in progress, waiting...');
    return initPromise;
  }

  // Start new initialization
  console.log('[FHE] Starting FHE SDK initialization...');
  setInitState({ status: 'initializing' });

  initPromise = (async () => {
    try {
      const instance = await initializeFheWithRetry(1);
      fheInstance = instance;
      setInitState({ status: 'ready' });
      console.log('[FHE] ✓ FHE SDK fully initialized and ready');
      return instance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('[FHE] ✗ Initialization failed:', errorMessage);

      // Reset promise to allow retry
      initPromise = null;
      setInitState({ status: 'error', error: errorMessage });

      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get the current FHE instance without initializing
 * Returns null if not yet initialized
 *
 * @returns FHE Instance or null if not initialized
 */
export function getFheInstance(): FheInstance | null {
  return fheInstance;
}

/**
 * Reset FHE instance (useful for testing or reconnecting)
 * Forces re-initialization on next ensureFheInstance() call
 */
export function resetFheInstance(): void {
  console.log('[FHE] Resetting instance');
  fheInstance = null;
  initPromise = null;
  setInitState({ status: 'idle' });
}

// ===========================
// Encryption Functions
// ===========================

/**
 * Weather condition enum for type safety
 */
export const WEATHER_CONDITIONS = {
  SUNNY: 0,
  RAINY: 1,
  SNOWY: 2,
  CLOUDY: 3,
} as const;

export type WeatherConditionIndex = typeof WEATHER_CONDITIONS[keyof typeof WEATHER_CONDITIONS];

/**
 * Encrypted forecast payload returned by encryptForecastPayload
 */
export interface EncryptedForecast {
  conditionHandle: `0x${string}`;  // Encrypted weather condition (euint8)
  stakeHandle: `0x${string}`;      // Encrypted stake amount (euint64)
  attestation: `0x${string}`;      // Zero-knowledge proof for verification (called attestation following PriceGuess pattern)
}

/**
 * Encrypt weather forecast payload for on-chain submission
 *
 * This function creates encrypted inputs using Zama FHE technology:
 * 1. Initializes FHE instance (with retry logic)
 * 2. Creates encrypted input builder for the contract
 * 3. Adds weather condition as euint8 (0-3 range)
 * 4. Adds stake amount as euint64 (wei)
 * 5. Generates encrypted handles and zero-knowledge proof
 *
 * Weather Condition Mapping:
 * - 0: Sunny ☀️
 * - 1: Rainy 🌧️
 * - 2: Snowy ❄️
 * - 3: Cloudy ☁️
 *
 * The encrypted data remains private until the market is settled by the oracle.
 * This ensures fair predictions without front-running.
 *
 * @param contractAddress - WeatherWager contract address (must be checksummed)
 * @param userAddress - User wallet address (must be checksummed)
 * @param condition - Weather condition index (0-3)
 * @param stakeWei - Stake amount in wei (bigint, e.g., parseEther("0.1"))
 *
 * @returns Promise<EncryptedForecast> - Encrypted handles and proof for contract submission
 *
 * @throws Error if FHE initialization fails
 * @throws Error if encryption fails
 * @throws Error if invalid condition index (must be 0-3)
 *
 * @example
 * ```typescript
 * import { encryptForecastPayload } from './fhe';
 * import { parseEther, getAddress } from 'viem';
 *
 * const payload = await encryptForecastPayload(
 *   getAddress(contractAddress),
 *   getAddress(userAddress),
 *   1, // Rainy
 *   parseEther("0.1") // 0.1 ETH stake
 * );
 *
 * // Submit to contract
 * await contract.placeForecast(
 *   cityId,
 *   payload.conditionHandle,
 *   payload.stakeHandle,
 *   payload.proof,
 *   commitment
 * );
 * ```
 */
export async function encryptForecastPayload(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  condition: number,
  stakeWei: bigint
): Promise<EncryptedForecast> {
  // Validate inputs
  if (condition < 0 || condition > 3) {
    throw new Error(`Invalid weather condition: ${condition}. Must be 0-3`);
  }

  if (stakeWei <= 0n) {
    throw new Error('Stake amount must be positive');
  }

  console.log('[FHE] Encrypting forecast payload:', {
    contractAddress,
    userAddress,
    condition: `${condition} (${Object.keys(WEATHER_CONDITIONS)[condition]})`,
    stakeWei: stakeWei.toString(),
  });

  try {
    // Ensure FHE instance is initialized
    // This will retry automatically if previous initialization failed
    const instance = await ensureFheInstance();

    // Create encrypted input builder
    // The builder accumulates all inputs before encryption
    const input = instance.createEncryptedInput(contractAddress, userAddress);

    // Add weather condition as euint8 (0-255 range, we use 0-3)
    // euint8 is more gas-efficient than euint64 for small values
    input.add8(condition);

    // Add stake amount as euint64 (supports up to 18.4 quintillion wei)
    // euint64 can handle up to ~18.4 ETH comfortably
    input.add64(stakeWei);

    // Encrypt all inputs and generate zero-knowledge proof
    // This proves that the encryption was done correctly without revealing the data
    console.log('[FHE] Generating encrypted handles and ZK proof...');
    const { handles, inputProof } = await input.encrypt();

    // Use hexlify from ethers.js to convert byte arrays to hex strings
    // This follows PriceGuess best practices and ensures proper conversion
    const conditionHandle = hexlify(handles[0]) as `0x${string}`;
    const stakeHandle = hexlify(handles[1]) as `0x${string}`;
    const attestation = hexlify(inputProof) as `0x${string}`;

    console.log('[FHE] ✓ Encryption successful', {
      conditionHandle: conditionHandle.substring(0, 10) + '...',
      stakeHandle: stakeHandle.substring(0, 10) + '...',
      attestationLength: attestation.length,
      conditionType: typeof conditionHandle,
      stakeType: typeof stakeHandle,
    });

    return {
      conditionHandle,
      stakeHandle,
      attestation,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
    console.error('[FHE] ✗ Encryption failed:', errorMessage);
    throw new Error(`Failed to encrypt forecast: ${errorMessage}`);
  }
}

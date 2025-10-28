/**
 * FHE SDK Initialization and Encryption Utilities
 *
 * This module provides FHE (Fully Homomorphic Encryption) functionality for the WeatherWager DApp.
 * It uses CDN dynamic import method recommended for Vite projects to avoid module resolution issues.
 *
 * Key Features:
 * - Lazy initialization of FHE SDK
 * - CDN-based dynamic import for better compatibility
 * - Singleton pattern to prevent multiple initializations
 * - Type-safe encryption functions for weather forecasts
 */

let fheInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Initialize FHE SDK using CDN dynamic import
 * This method is recommended for Vite projects to avoid npm bundle issues
 *
 * @returns Promise<FHE Instance> - The initialized FHE instance
 */
export async function initializeFHE() {
  // Return existing instance if already initialized
  if (fheInstance) {
    console.log('[FHE] Using existing instance');
    return fheInstance;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    console.log('[FHE] Initialization in progress, waiting...');
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      console.log('[FHE] Starting initialization via CDN...');

      // Dynamically load SDK from CDN (recommended for Vite)
      const sdk = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
      const { initSDK, createInstance, SepoliaConfig } = sdk;

      // Initialize WASM module (required before creating instance)
      console.log('[FHE] Initializing WASM...');
      await initSDK();

      // Create FHE instance with Sepolia testnet configuration
      console.log('[FHE] Creating instance with SepoliaConfig...');
      fheInstance = await createInstance(SepoliaConfig);

      console.log('[FHE] Instance initialized successfully');
      return fheInstance;
    } catch (error) {
      console.error('[FHE] Initialization failed:', error);
      initPromise = null; // Reset promise to allow retry
      throw new Error(`FHE initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();

  return initPromise;
}

/**
 * Get the current FHE instance without initializing
 *
 * @returns FHE Instance or null if not initialized
 */
export function getFheInstance() {
  return fheInstance;
}

/**
 * Check if FHE instance is ready
 *
 * @returns boolean - True if instance is initialized
 */
export function isFheReady(): boolean {
  return fheInstance !== null;
}

/**
 * Encrypt weather forecast payload for on-chain submission
 *
 * This function encrypts the weather condition (0-3) and stake amount (wei)
 * using FHE SDK before submitting to the smart contract.
 *
 * Weather Condition Mapping:
 * - 0: Sunny
 * - 1: Rainy
 * - 2: Snowy
 * - 3: Cloudy
 *
 * @param contractAddress - WeatherWager contract address (checksum format)
 * @param userAddress - User wallet address (checksum format)
 * @param condition - Weather condition index (0-3)
 * @param stakeWei - Stake amount in wei (bigint)
 * @returns Promise<{ conditionHandle, stakeHandle, proof }> - Encrypted handles and proof
 */
export async function encryptForecastPayload(
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  condition: number,
  stakeWei: bigint
): Promise<{
  conditionHandle: `0x${string}`;
  stakeHandle: `0x${string}`;
  proof: `0x${string}`;
}> {
  try {
    console.log('[FHE] Encrypting forecast payload:', {
      contractAddress,
      userAddress,
      condition,
      stakeWei: stakeWei.toString()
    });

    // Ensure FHE instance is initialized
    const fhe = await initializeFHE();

    // Create encrypted input for the contract
    const input = fhe.createEncryptedInput(contractAddress, userAddress);

    // Add weather condition as euint8 (0-255 range, we use 0-3)
    input.add8(condition);

    // Add stake amount as euint64 (supports up to 18.4 ETH)
    input.add64(stakeWei);

    // Encrypt the input and generate zero-knowledge proof
    console.log('[FHE] Generating encrypted handles and proof...');
    const { handles, inputProof } = await input.encrypt();

    // Convert to hex strings for contract call
    const result = {
      conditionHandle: `0x${Buffer.from(handles[0]).toString('hex')}` as `0x${string}`,
      stakeHandle: `0x${Buffer.from(handles[1]).toString('hex')}` as `0x${string}`,
      proof: `0x${Buffer.from(inputProof).toString('hex')}` as `0x${string}`
    };

    console.log('[FHE] Encryption successful:', {
      conditionHandleLength: result.conditionHandle.length,
      stakeHandleLength: result.stakeHandle.length,
      proofLength: result.proof.length
    });

    return result;
  } catch (error) {
    console.error('[FHE] Encryption failed:', error);
    throw new Error(`Failed to encrypt forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preload FHE SDK in the background (optional optimization)
 * Call this on app load to reduce latency when user makes first transaction
 */
export function preloadFHE(): void {
  if (!fheInstance && !initPromise) {
    console.log('[FHE] Preloading SDK in background...');
    initializeFHE().catch(error => {
      console.warn('[FHE] Background preload failed:', error);
    });
  }
}

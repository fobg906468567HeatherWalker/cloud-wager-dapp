/**
 * Weather Wager Contract Interaction Hooks
 *
 * This module provides React hooks for interacting with the WeatherWager smart contract.
 * All hooks use wagmi v2 and React Query for efficient data fetching and caching.
 *
 * Key Features:
 * - Type-safe contract interactions with TypeScript
 * - Automatic data caching and refetching with React Query
 * - FHE encryption for private forecasts
 * - Commitment scheme to prevent replay attacks
 * - User-friendly error messages and loading states
 *
 * @see https://wagmi.sh/react/hooks for wagmi documentation
 * @see https://tanstack.com/query for React Query documentation
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { encodePacked, keccak256, parseEther, formatEther, getAddress } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WEATHER_WAGER_ADDRESS, WEATHER_WAGER_SCALE } from "@/lib/config";
import { weatherWagerAbi } from "@/lib/abi/weatherWager";
import { publicClient } from "@/lib/viem";
import { conditionToIndex, indexToCondition } from "@/lib/weather";
import type { WeatherCondition } from "@/types/weather";
import { encryptForecastPayload } from "@/lib/fhe";
import { useToast } from "@/hooks/use-toast";

// ===========================
// Constants
// ===========================

const CONTRACT_ADDRESS = WEATHER_WAGER_ADDRESS;

// ===========================
// Utility Functions
// ===========================

/**
 * Ensure contract address is configured
 * @throws Error if contract address is not set in environment variables
 * @returns Contract address (checksummed)
 */
function requireContractAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "WeatherWager contract address is not configured. " +
      "Please set VITE_CONTRACT_ADDRESS in your .env file."
    );
  }
  return CONTRACT_ADDRESS;
}

// ===========================
// Type Definitions
// ===========================

/**
 * City market data structure
 */
export interface CityMarket {
  exists: boolean;              // Whether market exists
  conditionCount: number;       // Number of weather conditions (always 4)
  lockTimestamp: number;        // Unix timestamp when betting closes
  settled: boolean;             // Whether market has been settled
  winningCondition: number;     // Winning weather condition (0-3)
  payoutRatio: bigint;          // Payout ratio (scaled by 1_000_000)
  totalDepositedWei: bigint;    // Total ETH deposited
  totalPaidWei: bigint;         // Total ETH paid out
}

/**
 * Forecast ticket data structure
 */
export interface ForecastTicket {
  ticketId: bigint;             // Unique ticket ID
  cityId: number;               // City ID for this forecast
  bettor: `0x${string}`;        // User address who placed forecast
  commitment: `0x${string}`;    // Commitment hash (prevents replay)
  claimed: boolean;             // Whether winnings have been claimed
}

/**
 * Parameters for placing a forecast
 */
export interface PlaceForecastParams {
  cityId: number;               // City ID to bet on
  condition: WeatherCondition;  // Predicted weather condition
  stakeEth: string;             // Stake amount in ETH (e.g., "0.1")
}

// ===========================
// Data Fetching Functions
// ===========================

/**
 * Fetch city market data from contract
 *
 * @param cityId - City identifier (e.g., 1 for New York)
 * @returns Promise<CityMarket> - Market data including status and payouts
 * @throws Error if contract call fails
 */
export async function fetchCityMarket(cityId: number): Promise<CityMarket> {
  const address = requireContractAddress();

  try {
    const response = await publicClient.readContract({
      address,
      abi: weatherWagerAbi,
      functionName: "getCityMarket",
      args: [BigInt(cityId)],
    });

    // Destructure response tuple
    const [
      exists,
      conditionCount,
      lockTimestamp,
      settled,
      winningCondition,
      payoutRatio,
      totalDepositedWei,
      totalPaidWei
    ] = response;

    return {
      exists,
      conditionCount,
      lockTimestamp: Number(lockTimestamp),
      settled,
      winningCondition,
      payoutRatio,
      totalDepositedWei,
      totalPaidWei,
    };
  } catch (error) {
    console.error('[Contract] Failed to fetch city market:', error);
    throw new Error(`Failed to fetch market data for city ${cityId}`);
  }
}

/**
 * Fetch forecast ticket data from contract
 *
 * @param ticketId - Unique ticket identifier
 * @returns Promise<ForecastTicket> - Ticket data including bettor and claim status
 * @throws Error if contract call fails
 */
export async function fetchTicket(ticketId: bigint): Promise<ForecastTicket> {
  const address = requireContractAddress();

  try {
    const ticket = await publicClient.readContract({
      address,
      abi: weatherWagerAbi,
      functionName: "getTicket",
      args: [ticketId],
    });

    return {
      ticketId,
      cityId: Number(ticket.cityId),
      bettor: ticket.bettor,
      commitment: ticket.commitment,
      claimed: ticket.claimed,
    };
  } catch (error) {
    console.error('[Contract] Failed to fetch ticket:', error);
    throw new Error(`Failed to fetch ticket ${ticketId}`);
  }
}

// ===========================
// React Query Hooks
// ===========================

/**
 * Hook to fetch city market data with automatic caching and refetching
 *
 * Uses React Query for:
 * - Automatic background refetching every 30 seconds
 * - Caching to reduce unnecessary network requests
 * - Loading and error states
 *
 * @param cityId - Optional city ID to fetch market for
 * @returns React Query result with market data, loading state, and error
 *
 * @example
 * ```tsx
 * function MarketInfo({ cityId }: { cityId: number }) {
 *   const { data: market, isLoading, error } = useCityMarket(cityId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!market?.exists) return <div>Market not found</div>;
 *
 *   return <div>Market locked at: {new Date(market.lockTimestamp * 1000).toLocaleString()}</div>;
 * }
 * ```
 */
export function useCityMarket(cityId?: number) {
  return useQuery({
    queryKey: ["city-market", cityId],
    queryFn: () => fetchCityMarket(cityId!),
    enabled: Boolean(cityId && CONTRACT_ADDRESS),
    staleTime: 30_000,  // Consider data fresh for 30 seconds
    refetchInterval: 30_000,  // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch all tickets for a specific city with automatic caching
 *
 * Fetches:
 * 1. List of ticket IDs for the city
 * 2. Details for each ticket in parallel
 *
 * @param cityId - Optional city ID to fetch tickets for
 * @returns React Query result with array of ticket details
 *
 * @example
 * ```tsx
 * function MyBets({ cityId }: { cityId: number }) {
 *   const { data: tickets, isLoading } = useCityTickets(cityId);
 *   const { address } = useAccount();
 *
 *   const myTickets = tickets?.filter(t => t.bettor === address);
 *
 *   return (
 *     <div>
 *       <h3>My Bets</h3>
 *       {myTickets?.map(ticket => (
 *         <TicketCard key={ticket.ticketId.toString()} ticket={ticket} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCityTickets(cityId?: number) {
  return useQuery({
    queryKey: ["city-tickets", cityId],
    enabled: Boolean(cityId && CONTRACT_ADDRESS),
    staleTime: 30_000,
    queryFn: async () => {
      const address = requireContractAddress();

      try {
        // Fetch ticket IDs for this city
        const tickets = await publicClient.readContract({
          address,
          abi: weatherWagerAbi,
          functionName: "getTicketsForCity",
          args: [BigInt(cityId!)],
        });

        // Fetch details for all tickets in parallel
        const details = await Promise.all(
          tickets.map((id: bigint) => fetchTicket(id))
        );

        return details;
      } catch (error) {
        console.error('[Contract] Failed to fetch city tickets:', error);
        throw new Error(`Failed to fetch tickets for city ${cityId}`);
      }
    },
  });
}

// ===========================
// Mutation Hooks
// ===========================

/**
 * Hook to place an encrypted weather forecast
 *
 * This hook handles the complete forecast submission flow:
 * 1. Validates user is connected
 * 2. Converts ETH stake to wei
 * 3. Encrypts weather condition and stake using FHE
 * 4. Generates commitment hash to prevent replay attacks
 * 5. Submits transaction to contract
 * 6. Invalidates cached data on success
 * 7. Shows toast notifications
 *
 * @param cityId - Optional city ID (for query invalidation)
 * @returns React Query mutation result with mutate function and states
 *
 * @example
 * ```tsx
 * function ForecastForm({ cityId }: { cityId: number }) {
 *   const placeForecast = usePlaceForecast(cityId);
 *
 *   const handleSubmit = async (condition: WeatherCondition, stakeEth: string) => {
 *     await placeForecast.mutateAsync({ cityId, condition, stakeEth });
 *   };
 *
 *   return (
 *     <form onSubmit={() => handleSubmit('Sunny', '0.1')}>
 *       <button disabled={placeForecast.isPending}>
 *         {placeForecast.isPending ? 'Submitting...' : 'Place Forecast'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function usePlaceForecast(cityId?: number) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async ({ condition, stakeEth, cityId: targetCity }: PlaceForecastParams) => {
      // Validate wallet connection
      if (!address) {
        throw new Error("Please connect your wallet to place a forecast");
      }

      // Convert ETH string to wei bigint
      const stakeWei = parseEther(stakeEth);

      console.log('[Forecast] Starting forecast submission:', {
        cityId: targetCity,
        condition,
        stakeEth,
        stakeWei: stakeWei.toString(),
      });

      // Ensure addresses are properly checksummed
      // This is required for FHE encryption
      const checksumAddress = getAddress(address);
      const checksumContract = getAddress(requireContractAddress());

      // Encrypt forecast data using FHE
      // This ensures privacy of predictions until settlement
      const { conditionHandle, stakeHandle, attestation } = await encryptForecastPayload(
        checksumContract,
        checksumAddress,
        conditionToIndex(condition),
        stakeWei,
      );

      console.log('[Forecast] Encrypted data ready:', {
        conditionType: typeof conditionHandle,
        stakeType: typeof stakeHandle,
        attestationType: typeof attestation,
        conditionValue: conditionHandle.substring(0, 10) + '...',
        stakeValue: stakeHandle.substring(0, 10) + '...',
        attestationLength: attestation.length,
      });

      // Generate commitment hash
      // This prevents replay attacks by ensuring each forecast is unique
      const commitment = keccak256(
        encodePacked(
          ["address", "uint256", "bytes", "bytes"],
          [checksumAddress, BigInt(targetCity), conditionHandle, stakeHandle],
        ),
      );

      console.log('[Forecast] Submitting transaction with encrypted data');

      // Submit transaction to contract
      const hash = await writeContractAsync({
        address: checksumContract,
        abi: weatherWagerAbi,
        functionName: "placeForecast",
        args: [BigInt(targetCity), conditionHandle, stakeHandle, attestation, commitment],
        value: stakeWei,  // Send ETH with transaction
        gas: 5_000_000n,  // Set reasonable gas limit for FHE operations (Sepolia cap: 16777216)
      });

      console.log('[Forecast] Transaction submitted:', hash);
      return hash;
    },
    onSuccess: async (hash, variables) => {
      console.log('[Forecast] ✓ Forecast placed successfully:', hash);

      // Invalidate cached data to trigger refetch
      await queryClient.invalidateQueries({
        queryKey: ["city-tickets", variables.cityId]
      });
      await queryClient.invalidateQueries({
        queryKey: ["city-market", variables.cityId]
      });

      // Show success notification
      toast({
        title: "Forecast submitted successfully!",
        description: `Your encrypted prediction for ${variables.stakeEth} ETH is now on-chain. View on Etherscan.`,
      });
    },
    onError: (error) => {
      console.error('[Forecast] ✗ Forecast submission failed:', error);

      // Parse error message for user-friendly display
      let errorMessage = error.message;

      if (errorMessage.includes("User rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH balance for this stake amount";
      } else if (errorMessage.includes("Market locked")) {
        errorMessage = "Market is locked. Betting is closed for this city.";
      } else if (errorMessage.includes("Commitment used")) {
        errorMessage = "This forecast has already been submitted. Please try again.";
      }

      // Show error notification
      toast({
        title: "Forecast submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// ===========================
// Utility Functions
// ===========================

/**
 * Format payout amount from wei to ETH with 6 decimal places
 *
 * @param value - Amount in wei (bigint)
 * @returns Formatted ETH string (e.g., "0.123456")
 *
 * @example
 * ```typescript
 * const payout = formatPayout(parseEther("0.123456789"));
 * console.log(payout); // "0.123456"
 * ```
 */
export function formatPayout(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(6);
}

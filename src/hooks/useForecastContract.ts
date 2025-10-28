import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { encodePacked, keccak256, parseEther, formatEther } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { WEATHER_WAGER_ADDRESS, WEATHER_WAGER_SCALE } from "@/lib/config";
import { weatherWagerAbi } from "@/lib/abi/weatherWager";
import { publicClient } from "@/lib/viem";
import { conditionToIndex, indexToCondition } from "@/lib/weather";
import type { WeatherCondition } from "@/types/weather";
import { encryptForecastPayload } from "@/lib/fhe";
import { useToast } from "@/hooks/use-toast";

const CONTRACT_ADDRESS = WEATHER_WAGER_ADDRESS;

function requireContractAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) {
    throw new Error("WeatherWager contract address is not configured");
  }
  return CONTRACT_ADDRESS;
}

export async function fetchCityMarket(cityId: number) {
  const address = requireContractAddress();
  const response = await publicClient.readContract({
    address,
    abi: weatherWagerAbi,
    functionName: "getCityMarket",
    args: [BigInt(cityId)],
  });
  const [exists, conditionCount, lockTimestamp, settled, winningCondition, payoutRatio, totalDepositedWei, totalPaidWei] = response;
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
}

export async function fetchTicket(ticketId: bigint) {
  const address = requireContractAddress();
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
}

export function useCityMarket(cityId?: number) {
  return useQuery({
    queryKey: ["city-market", cityId],
    queryFn: () => fetchCityMarket(cityId!),
    enabled: Boolean(cityId && CONTRACT_ADDRESS),
    staleTime: 30_000,
  });
}

export function useCityTickets(cityId?: number) {
  return useQuery({
    queryKey: ["city-tickets", cityId],
    enabled: Boolean(cityId && CONTRACT_ADDRESS),
    queryFn: async () => {
      const address = requireContractAddress();
      const tickets = await publicClient.readContract({
        address,
        abi: weatherWagerAbi,
        functionName: "getTicketsForCity",
        args: [BigInt(cityId!)],
      });

      const details = await Promise.all(tickets.map((id: bigint) => fetchTicket(id)));
      return details;
    },
  });
}

type PlaceForecastParams = {
  cityId: number;
  condition: WeatherCondition;
  stakeEth: string;
};

export function usePlaceForecast(cityId?: number) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async ({ condition, stakeEth, cityId: targetCity }: PlaceForecastParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      const stakeWei = parseEther(stakeEth);
      const { conditionHandle, stakeHandle, proof } = await encryptForecastPayload(
        requireContractAddress(),
        address,
        conditionToIndex(condition),
        stakeWei,
      );

      const commitment = keccak256(
        encodePacked(
          ["address", "uint256", "bytes32", "bytes32"],
          [address, BigInt(targetCity), conditionHandle, stakeHandle],
        ),
      );

      const hash = await writeContractAsync({
        address: requireContractAddress(),
        abi: weatherWagerAbi,
        functionName: "placeForecast",
        args: [BigInt(targetCity), conditionHandle, stakeHandle, proof, commitment],
        value: stakeWei,
      });

      return hash;
    },
    onSuccess: async (_hash, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["city-tickets", variables.cityId] });
      toast({
        title: "Forecast submitted",
        description: `Encrypted wager for ${variables.stakeEth} ETH is on-chain.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Forecast failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function formatPayout(value: bigint) {
  return Number.parseFloat(formatEther(value)).toFixed(6);
}

/**
 * Platform Stats Hook
 * 
 * Fetches real-time platform statistics from the BitHive smart contract.
 * Provides live data for total raised, campaigns count, and success rate.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import { BITHIVE, NETWORK } from "@/lib/contracts";

// ===========================================
// Types
// ===========================================

export interface PlatformStats {
  totalRaised: number;        // Total sBTC raised (in sats, converted to sBTC for display)
  totalCampaigns: number;     // Total number of campaigns
  successfulCampaigns: number; // Number of successful campaigns
  successRate: number;        // Success rate percentage
  isLoading: boolean;
  error: Error | null;
}

// ===========================================
// Contract Read Functions
// ===========================================

// Safe conversion helper - handles Clarity CV objects with .value property
function extractValue(value: unknown): string | number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "object" && "value" in (value as Record<string, unknown>)) {
    return extractValue((value as Record<string, unknown>).value);
  }
  return 0;
}

async function fetchPlatformStats(): Promise<{
  totalRaised: bigint;
  totalCampaigns: number;
  successfulCampaigns: number;
}> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: BITHIVE.address,
      contractName: BITHIVE.name,
      functionName: "get-platform-stats",
      functionArgs: [],
      network: NETWORK,
      senderAddress: BITHIVE.address,
    });
    
    const data = cvToValue(result) as Record<string, unknown>;
    
    const totalCampaignsVal = extractValue(data["total-campaigns"]);
    const successfulCampaignsVal = extractValue(data["successful-campaigns"]);
    const totalRaisedVal = extractValue(data["total-raised"]);
    
    return {
      totalCampaigns: Number(totalCampaignsVal) || 0,
      successfulCampaigns: Number(successfulCampaignsVal) || 0,
      totalRaised: BigInt(totalRaisedVal || 0),
    };
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    throw error;
  }
}

// ===========================================
// Hook
// ===========================================

export function usePlatformStats(): PlatformStats {
  const { data, isLoading, error } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: fetchPlatformStats,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });

  // Convert sats to sBTC (8 decimal places)
  const totalRaisedSbtc = data ? Number(data.totalRaised) / 100_000_000 : 0;
  
  // Calculate success rate
  const successRate = data && data.totalCampaigns > 0
    ? Math.round((data.successfulCampaigns / data.totalCampaigns) * 100)
    : 0;

  return {
    totalRaised: totalRaisedSbtc,
    totalCampaigns: data?.totalCampaigns || 0,
    successfulCampaigns: data?.successfulCampaigns || 0,
    successRate,
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook for the hero dashboard mockup
 * Returns stats formatted for the dashboard display with live updates
 */
export function useLiveStats() {
  const stats = usePlatformStats();
  
  return {
    raised: stats.totalRaised,
    campaigns: stats.totalCampaigns,
    backers: stats.successfulCampaigns, // Using successful campaigns as proxy for active backers
    isLoading: stats.isLoading,
  };
}

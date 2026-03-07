/**
 * useCampaigns Hook
 * 
 * Fetches and manages campaign data from the BitHive smart contract.
 * Uses TanStack Query for caching and real-time updates.
 */
import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue, ClarityValue } from "@stacks/transactions";
import { BITHIVE, NETWORK, type ContractCampaign, type ContractMilestone } from "@/lib/contracts";
import type { Campaign, Milestone } from "@/lib/mock-data";

// ===========================================
// Constants
// ===========================================

// Average block time on Stacks (approx 10 minutes)
const BLOCK_TIME_SECONDS = 600;
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS); // ~144 blocks/day

// Placeholder images for campaigns (can be extended with category-based images)
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
];

// sBTC has 8 decimals
const SBTC_DECIMALS = 8;

// ===========================================
// Helper Functions
// ===========================================

/**
 * Call a read-only function on the BitHive contract
 */
async function callReadOnly<T>(
  functionName: string,
  functionArgs: ClarityValue[] = []
): Promise<T> {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: BITHIVE.address,
    contractName: BITHIVE.name,
    functionName,
    functionArgs,
    network: NETWORK,
    senderAddress: BITHIVE.address,
  });
  
  return cvToValue(result) as T;
}

/**
 * Get current block height from the Stacks API
 */
async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch("https://api.testnet.hiro.so/v2/info");
    const data = await response.json();
    return data.stacks_tip_height;
  } catch {
    return 0;
  }
}

/**
 * Convert sBTC micro-units to BTC-like decimal
 */
function satsToBTC(sats: bigint): number {
  return Number(sats) / Math.pow(10, SBTC_DECIMALS);
}

/**
 * Calculate days left from end block and current block
 */
function calculateDaysLeft(endBlock: number, currentBlock: number): number {
  if (currentBlock >= endBlock) return 0;
  const blocksLeft = endBlock - currentBlock;
  return Math.ceil(blocksLeft / BLOCKS_PER_DAY);
}

/**
 * Determine campaign status from contract data
 */
function determineCampaignStatus(
  campaign: ContractCampaign,
  currentBlock: number
): "active" | "successful" | "failed" | "ended" {
  const isEnded = currentBlock >= campaign.endBlock;
  const goalReached = campaign.raised >= campaign.goal;
  
  if (!isEnded) return "active";
  if (campaign.claimed) return "ended";
  if (goalReached) return "successful";
  return "failed";
}

/**
 * Fetch a single campaign with its milestones
 */
async function fetchCampaignWithMilestones(
  campaignId: number,
  currentBlock: number
): Promise<Campaign | null> {
  // Fetch campaign data
  const data = await callReadOnly<Record<string, unknown> | null>(
    "get-campaign",
    [Cl.uint(campaignId)]
  );
  
  if (!data) return null;

  // Parse contract data
  const contractCampaign: ContractCampaign = {
    owner: data.owner as string,
    title: data.title as string,
    description: data.description as string,
    goal: BigInt(data.goal as string | number),
    raised: BigInt(data.raised as string | number),
    contributorsCount: Number(data["contributors-count"]),
    startBlock: Number(data["start-block"]),
    endBlock: Number(data["end-block"]),
    claimed: Boolean(data.claimed),
    refundsEnabled: Boolean(data["refunds-enabled"]),
    milestonesCount: Number(data["milestones-count"]),
    milestonesCompleted: Number(data["milestones-completed"]),
  };

  // Fetch milestones
  const milestones: Milestone[] = [];
  for (let i = 1; i <= contractCampaign.milestonesCount; i++) {
    const milestoneData = await callReadOnly<Record<string, unknown> | null>(
      "get-milestone",
      [Cl.uint(campaignId), Cl.uint(i)]
    );
    
    if (milestoneData) {
      milestones.push({
        id: `m${i}`,
        title: milestoneData.title as string,
        description: milestoneData.description as string,
        amount: satsToBTC(BigInt(milestoneData.amount as string | number)),
        completed: Boolean(milestoneData.completed),
      });
    }
  }

  // Transform to frontend Campaign interface
  const status = determineCampaignStatus(contractCampaign, currentBlock);
  
  return {
    id: campaignId.toString(),
    title: contractCampaign.title,
    description: contractCampaign.description,
    story: contractCampaign.description, // Use description as story (no separate field in contract)
    category: "General", // Contract doesn't store category
    imageUrl: PLACEHOLDER_IMAGES[campaignId % PLACEHOLDER_IMAGES.length],
    goalAmount: satsToBTC(contractCampaign.goal),
    raisedAmount: satsToBTC(contractCampaign.raised),
    backerCount: contractCampaign.contributorsCount,
    daysLeft: calculateDaysLeft(contractCampaign.endBlock, currentBlock),
    creatorAddress: contractCampaign.owner,
    creatorName: `Creator ${contractCampaign.owner.slice(-4)}`,
    status,
    milestones,
    backers: [], // Would need off-chain indexing or events to populate
    updates: [], // Would need off-chain storage
    createdAt: new Date().toISOString().split("T")[0], // Approximation
  };
}

/**
 * Fetch all campaigns from the contract
 */
async function fetchAllCampaigns(): Promise<Campaign[]> {
  // Get total number of campaigns
  const nonce = await callReadOnly<string | number>("get-campaign-nonce");
  const totalCampaigns = Number(nonce);
  
  if (totalCampaigns === 0) return [];

  // Get current block height
  const currentBlock = await getCurrentBlockHeight();
  
  // Fetch all campaigns (IDs start at 1)
  const campaigns: Campaign[] = [];
  for (let i = 1; i <= totalCampaigns; i++) {
    const campaign = await fetchCampaignWithMilestones(i, currentBlock);
    if (campaign) {
      campaigns.push(campaign);
    }
  }
  
  return campaigns;
}

// ===========================================
// Hook
// ===========================================

export function useCampaigns(filters?: {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
}) {
  const queryClient = useQueryClient();

  // Fetch all campaigns with caching
  const {
    data: allCampaigns = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchAllCampaigns,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Filter and sort campaigns
  const campaigns = useMemo(() => {
    let result = [...allCampaigns];

    if (filters?.status && filters.status !== "all") {
      if (filters.status === "ending-soon") {
        result = result.filter((c) => c.status === "active" && c.daysLeft <= 7);
      } else {
        result = result.filter((c) => c.status === filters.status);
      }
    }

    if (filters?.category && filters.category !== "All") {
      result = result.filter((c) => c.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (filters?.sort) {
      switch (filters.sort) {
        case "most-funded":
          result.sort((a, b) => b.raisedAmount - a.raisedAmount);
          break;
        case "ending-soon":
          result.sort((a, b) => a.daysLeft - b.daysLeft);
          break;
        case "most-backers":
          result.sort((a, b) => b.backerCount - a.backerCount);
          break;
        case "newest":
        default:
          // Sort by ID descending (newest first)
          result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
          break;
      }
    }

    return result;
  }, [allCampaigns, filters?.status, filters?.category, filters?.search, filters?.sort]);

  // Get campaign by ID
  const getCampaignById = useCallback((id: string): Campaign | undefined => {
    return allCampaigns.find((c) => c.id === id);
  }, [allCampaigns]);

  // Featured campaigns (active with highest funding)
  const featuredCampaigns = useMemo(() => {
    return allCampaigns
      .filter((c) => c.status === "active")
      .sort((a, b) => b.raisedAmount - a.raisedAmount)
      .slice(0, 4);
  }, [allCampaigns]);

  // Invalidate campaigns cache (useful after contributing/creating)
  const invalidateCampaigns = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  }, [queryClient]);

  return {
    campaigns,
    getCampaignById,
    featuredCampaigns,
    isLoading,
    error,
    refetch,
    invalidateCampaigns,
  };
}

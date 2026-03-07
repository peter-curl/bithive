/**
 * BitHive Smart Contract Configuration
 * 
 * All contract addresses and constants for testnet integration.
 * Based on deployed contracts from Clarinet.
 */

// ===========================================
// Contract Addresses (Testnet)
// ===========================================

export const CONTRACTS = {
  /** BitHive crowdfunding contract */
  BITHIVE: "ST3X2FX5PMJZVRSXXQMVGAX7AC2H75JPVD0ERM2SW.bithive-v2",
  /** sBTC token contract */
  SBTC: "ST3X2FX5PMJZVRSXXQMVGAX7AC2H75JPVD0ERM2SW.sbtc-token",
  /** SIP-010 trait */
  SIP010_TRAIT: "ST3X2FX5PMJZVRSXXQMVGAX7AC2H75JPVD0ERM2SW.sip-010-trait-ft-standard",
} as const;

// Parse contract principal into address and name
export function parseContractId(contractId: string): { address: string; name: string } {
  const [address, name] = contractId.split(".");
  return { address, name };
}

export const BITHIVE = parseContractId(CONTRACTS.BITHIVE);
export const SBTC = parseContractId(CONTRACTS.SBTC);

// ===========================================
// Network Configuration
// ===========================================

export const NETWORK = "testnet" as const;
export const STACKS_API_URL = "https://api.testnet.hiro.so";
export const EXPLORER_URL = "https://explorer.hiro.so";

// ===========================================
// Platform Constants
// ===========================================

/** Platform fee percentage (2%) */
export const PLATFORM_FEE_PERCENT = 2;

/** Blocks per day (approximately) */
export const BLOCKS_PER_DAY = 144;

/** Minimum campaign duration in blocks */
export const MIN_CAMPAIGN_DURATION = BLOCKS_PER_DAY * 7; // 7 days

/** Maximum campaign duration in blocks */
export const MAX_CAMPAIGN_DURATION = BLOCKS_PER_DAY * 90; // 90 days

// ===========================================
// Error Code Mapping
// ===========================================

export const CONTRACT_ERRORS: Record<number, string> = {
  100: "Only the contract owner can perform this action",
  101: "Only the campaign owner can perform this action",
  102: "Campaign not found",
  103: "Campaign has ended",
  104: "Campaign is still active",
  105: "Funding goal was not reached",
  106: "Funds have already been claimed",
  107: "You haven't contributed to this campaign",
  108: "Amount must be greater than zero",
  109: "Campaign did not reach its goal",
  110: "Token transfer failed - check your sBTC balance",
  111: "Milestone not found",
  112: "Milestone cannot be completed yet",
  113: "Milestone has already been completed",
  114: "Milestone amount exceeds remaining goal",
  115: "Refunds have not been enabled",
  116: "Contract has not been initialized",
  117: "Contract is already initialized",
};

/**
 * Get human-readable error message from contract error code
 */
export function getContractError(errorCode: number): string {
  return CONTRACT_ERRORS[errorCode] || `Unknown error (code: ${errorCode})`;
}

// ===========================================
// Type Definitions
// ===========================================

export interface ContractCampaign {
  owner: string;
  title: string;
  description: string;
  goal: bigint;
  raised: bigint;          // sBTC raised
  stxRaised: bigint;       // STX raised
  contributorsCount: number;
  startBlock: number;
  endBlock: number;
  claimed: boolean;        // sBTC funds claimed
  stxClaimed: boolean;     // STX funds claimed
  refundsEnabled: boolean;
  milestonesCount: number;
  milestonesCompleted: number;
}

export interface ContractMilestone {
  title: string;
  description: string;
  amount: bigint;
  completed: boolean;
  claimed: boolean;
}

export interface PlatformStats {
  totalCampaigns: number;
  successfulCampaigns: number;
  totalRaised: bigint;
}

export interface CreatorStats {
  campaignsCreated: number;
  campaignsSuccessful: number;
  totalRaised: bigint;
}

export interface BackerStats {
  campaignsBacked: number;
  totalContributed: bigint;
}

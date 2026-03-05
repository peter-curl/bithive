/**
 * BitHive Contract Hook
 * 
 * Provides all read and write operations for the BitHive smart contract.
 * Uses official Stacks SDKs with testnet configuration.
 */
import { useCallback } from "react";
import { request } from "@stacks/connect";
import { 
  fetchCallReadOnlyFunction,
  Cl,
  cvToValue,
  ClarityValue,
} from "@stacks/transactions";
import { 
  BITHIVE, 
  CONTRACTS,
  NETWORK,
  getContractError,
  type ContractCampaign,
  type ContractMilestone,
  type PlatformStats,
  type CreatorStats,
  type BackerStats,
} from "@/lib/contracts";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

// ===========================================
// Helper Functions
// ===========================================

/**
 * Call a read-only function on the BitHive contract
 */
async function callReadOnly<T>(
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string
): Promise<T> {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: BITHIVE.address,
    contractName: BITHIVE.name,
    functionName,
    functionArgs,
    network: NETWORK,
    senderAddress: senderAddress || BITHIVE.address,
  });
  
  return cvToValue(result) as T;
}

/**
 * Parse campaign data from contract response
 */
function parseCampaign(data: Record<string, unknown>): ContractCampaign | null {
  if (!data) return null;
  
  return {
    owner: data.owner as string,
    title: data.title as string,
    description: data.description as string,
    goal: BigInt(data.goal as string | number),
    raised: BigInt(data.raised as string | number),
    stxRaised: BigInt((data["stx-raised"] as string | number) || "0"),
    contributorsCount: Number(data["contributors-count"]),
    startBlock: Number(data["start-block"]),
    endBlock: Number(data["end-block"]),
    claimed: Boolean(data.claimed),
    stxClaimed: Boolean(data["stx-claimed"]),
    refundsEnabled: Boolean(data["refunds-enabled"]),
    milestonesCount: Number(data["milestones-count"]),
    milestonesCompleted: Number(data["milestones-completed"]),
  };
}

/**
 * Parse milestone data from contract response
 */
function parseMilestone(data: Record<string, unknown>): ContractMilestone | null {
  if (!data) return null;
  
  return {
    title: data.title as string,
    description: data.description as string,
    amount: BigInt(data.amount as string | number),
    completed: Boolean(data.completed),
    claimed: Boolean(data.claimed),
  };
}

// ===========================================
// Hook
// ===========================================

export function useContract() {
  const { wallet } = useWallet();

  // ===========================================
  // Read-Only Functions
  // ===========================================

  /**
   * Get platform-wide statistics
   */
  const getPlatformStats = useCallback(async (): Promise<PlatformStats> => {
    const result = await callReadOnly<Record<string, unknown>>("get-platform-stats");
    return {
      totalCampaigns: Number(result["total-campaigns"]),
      successfulCampaigns: Number(result["successful-campaigns"]),
      totalRaised: BigInt(result["total-raised"] as string | number),
    };
  }, []);

  /**
   * Get total number of campaigns (nonce)
   */
  const getCampaignNonce = useCallback(async (): Promise<number> => {
    const result = await callReadOnly<string | number>("get-campaign-nonce");
    return Number(result);
  }, []);

  /**
   * Get campaign by ID
   */
  const getCampaign = useCallback(async (campaignId: number): Promise<ContractCampaign | null> => {
    const result = await callReadOnly<Record<string, unknown> | null>(
      "get-campaign",
      [Cl.uint(campaignId)]
    );
    return parseCampaign(result as Record<string, unknown>);
  }, []);

  /**
   * Get milestone by campaign ID and milestone ID
   */
  const getMilestone = useCallback(async (
    campaignId: number, 
    milestoneId: number
  ): Promise<ContractMilestone | null> => {
    const result = await callReadOnly<Record<string, unknown> | null>(
      "get-milestone",
      [Cl.uint(campaignId), Cl.uint(milestoneId)]
    );
    return parseMilestone(result as Record<string, unknown>);
  }, []);

  /**
   * Get user's sBTC contribution to a campaign
   */
  const getContribution = useCallback(async (
    campaignId: number,
    contributor: string
  ): Promise<bigint> => {
    const result = await callReadOnly<string | number>(
      "get-contribution",
      [Cl.uint(campaignId), Cl.principal(contributor)]
    );
    return BigInt(result);
  }, []);

  /**
   * Get user's STX contribution to a campaign
   */
  const getStxContribution = useCallback(async (
    campaignId: number,
    contributor: string
  ): Promise<bigint> => {
    const result = await callReadOnly<string | number>(
      "get-stx-contribution",
      [Cl.uint(campaignId), Cl.principal(contributor)]
    );
    return BigInt(result);
  }, []);

  /**
   * Check if campaign is active
   */
  const isCampaignActive = useCallback(async (campaignId: number): Promise<boolean> => {
    return await callReadOnly<boolean>("is-campaign-active", [Cl.uint(campaignId)]);
  }, []);

  /**
   * Check if campaign is successful
   */
  const isCampaignSuccessful = useCallback(async (campaignId: number): Promise<boolean> => {
    return await callReadOnly<boolean>("is-campaign-successful", [Cl.uint(campaignId)]);
  }, []);

  /**
   * Get campaign progress percentage
   */
  const getProgressPercentage = useCallback(async (campaignId: number): Promise<number> => {
    const result = await callReadOnly<string | number>(
      "get-progress-percentage",
      [Cl.uint(campaignId)]
    );
    return Number(result);
  }, []);

  /**
   * Get time remaining in blocks
   */
  const getTimeRemaining = useCallback(async (campaignId: number): Promise<number> => {
    const result = await callReadOnly<string | number>(
      "get-time-remaining",
      [Cl.uint(campaignId)]
    );
    return Number(result);
  }, []);

  /**
   * Get creator statistics
   */
  const getCreatorStats = useCallback(async (creator: string): Promise<CreatorStats> => {
    const result = await callReadOnly<Record<string, unknown>>(
      "get-creator-stats",
      [Cl.principal(creator)]
    );
    return {
      campaignsCreated: Number(result["campaigns-created"]),
      campaignsSuccessful: Number(result["campaigns-successful"]),
      totalRaised: BigInt(result["total-raised"] as string | number),
    };
  }, []);

  /**
   * Get backer statistics
   */
  const getBackerStats = useCallback(async (backer: string): Promise<BackerStats> => {
    const result = await callReadOnly<Record<string, unknown>>(
      "get-backer-stats",
      [Cl.principal(backer)]
    );
    return {
      campaignsBacked: Number(result["campaigns-backed"]),
      totalContributed: BigInt(result["total-contributed"] as string | number),
    };
  }, []);

  /**
   * Calculate platform fee for an amount
   */
  const calculateFee = useCallback(async (amount: bigint): Promise<bigint> => {
    const result = await callReadOnly<string | number>(
      "calculate-fee",
      [Cl.uint(amount)]
    );
    return BigInt(result);
  }, []);

  // ===========================================
  // Write Functions (Wallet Signing)
  // ===========================================

  /**
   * Create a new campaign
   */
  const createCampaign = useCallback(async (
    title: string,
    description: string,
    goal: bigint,
    duration: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "create-campaign",
        functionArgs: [
          Cl.stringUtf8(title),
          Cl.stringUtf8(description),
          Cl.uint(goal),
          Cl.uint(duration),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("Campaign created!", {
        description: "Your campaign is being processed on the blockchain.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      // Check for contract error codes
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Campaign creation failed", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Campaign creation failed", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Contribute sBTC to a campaign
   */
  const contribute = useCallback(async (
    campaignId: number,
    amount: bigint
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "contribute",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.uint(amount),
          Cl.contractPrincipal(
            CONTRACTS.SBTC.split(".")[0],
            CONTRACTS.SBTC.split(".")[1]
          ),
        ],
        network: NETWORK,
        postConditionMode: "allow", // We allow because the contract handles the transfer
      });

      toast.success("sBTC contribution submitted!", {
        description: "Your contribution is being processed.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Contribution failed", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Contribution failed", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Contribute STX to a campaign (no sBTC required)
   */
  const contributeStx = useCallback(async (
    campaignId: number,
    amount: bigint
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "contribute-stx",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.uint(amount),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("STX contribution submitted!", {
        description: "Your STX contribution is being processed.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("STX contribution failed", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("STX contribution failed", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Add a milestone to a campaign
   */
  const addMilestone = useCallback(async (
    campaignId: number,
    title: string,
    description: string,
    amount: bigint
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "add-milestone",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.stringUtf8(title),
          Cl.stringUtf8(description),
          Cl.uint(amount),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("Milestone added!", {
        description: "Your milestone has been added to the campaign.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to add milestone", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to add milestone", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Complete a milestone
   */
  const completeMilestone = useCallback(async (
    campaignId: number,
    milestoneId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "complete-milestone",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.uint(milestoneId),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("Milestone completed!", {
        description: "The milestone has been marked as complete.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to complete milestone", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to complete milestone", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Claim sBTC funds from a successful campaign
   */
  const claimFunds = useCallback(async (
    campaignId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "claim-funds",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.contractPrincipal(
            CONTRACTS.SBTC.split(".")[0],
            CONTRACTS.SBTC.split(".")[1]
          ),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("sBTC funds claimed!", {
        description: "The sBTC has been transferred to your wallet.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to claim sBTC funds", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to claim sBTC funds", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Claim STX funds from a successful campaign
   */
  const claimFundsStx = useCallback(async (
    campaignId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "claim-funds-stx",
        functionArgs: [Cl.uint(campaignId)],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("STX funds claimed!", {
        description: "The STX has been transferred to your wallet.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to claim STX funds", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to claim STX funds", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Enable refunds for a failed campaign
   */
  const enableRefunds = useCallback(async (
    campaignId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "enable-refunds",
        functionArgs: [Cl.uint(campaignId)],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("Refunds enabled!", {
        description: "Backers can now claim their refunds.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to enable refunds", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to enable refunds", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Claim sBTC refund from a failed campaign
   */
  const claimRefund = useCallback(async (
    campaignId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "claim-refund",
        functionArgs: [
          Cl.uint(campaignId),
          Cl.contractPrincipal(
            CONTRACTS.SBTC.split(".")[0],
            CONTRACTS.SBTC.split(".")[1]
          ),
        ],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("sBTC refund claimed!", {
        description: "Your sBTC contribution has been refunded.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to claim sBTC refund", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to claim sBTC refund", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  /**
   * Claim STX refund from a failed campaign
   */
  const claimRefundStx = useCallback(async (
    campaignId: number
  ): Promise<{ success: boolean; txId?: string; error?: string }> => {
    if (!wallet.connected) {
      return { success: false, error: "Wallet not connected" };
    }

    try {
      const result = await request("stx_callContract", {
        contract: CONTRACTS.BITHIVE,
        functionName: "claim-refund-stx",
        functionArgs: [Cl.uint(campaignId)],
        network: NETWORK,
        postConditionMode: "allow",
      });

      toast.success("STX refund claimed!", {
        description: "Your STX contribution has been refunded.",
      });

      return { success: true, txId: result.txId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      
      const errorMatch = message.match(/\(err u(\d+)\)/);
      if (errorMatch) {
        const errorCode = parseInt(errorMatch[1], 10);
        toast.error("Failed to claim STX refund", {
          description: getContractError(errorCode),
        });
        return { success: false, error: getContractError(errorCode) };
      }
      
      toast.error("Failed to claim STX refund", { description: message });
      return { success: false, error: message };
    }
  }, [wallet.connected]);

  // ===========================================
  // Return all functions
  // ===========================================

  return {
    // Read-only
    getPlatformStats,
    getCampaignNonce,
    getCampaign,
    getMilestone,
    getContribution,
    getStxContribution,
    isCampaignActive,
    isCampaignSuccessful,
    getProgressPercentage,
    getTimeRemaining,
    getCreatorStats,
    getBackerStats,
    calculateFee,
    
    // Write (wallet signing)
    createCampaign,
    contribute,
    contributeStx,
    addMilestone,
    completeMilestone,
    claimFunds,
    claimFundsStx,
    enableRefunds,
    claimRefund,
    claimRefundStx,
  };
}

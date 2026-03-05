import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlusCircle, Eye, CheckCircle2, XCircle, Clock, Hexagon, Wallet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useContract } from "@/hooks/useContract";
import { useQuery } from "@tanstack/react-query";
import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { BITHIVE, NETWORK, type ContractCampaign } from "@/lib/contracts";

// ===========================================
// Constants
// ===========================================

const SBTC_DECIMALS = 8;
const BLOCK_TIME_SECONDS = 600;
const BLOCKS_PER_DAY = Math.floor(86400 / BLOCK_TIME_SECONDS);

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop",
];

// ===========================================
// Helpers
// ===========================================

function satsToBTC(sats: bigint): number {
  return Number(sats) / Math.pow(10, SBTC_DECIMALS);
}

function formatBtc(val: number): string {
  if (val >= 1) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(3);
  if (val >= 0.0001) return val.toFixed(4);
  return val.toFixed(6);
}

/**
 * Safely convert a value to BigInt, handling various formats
 */
function toBigInt(value: unknown): bigint {
  if (value === null || value === undefined) return BigInt(0);
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.floor(value));
  if (typeof value === "string") return BigInt(value || "0");
  // Handle Clarity value objects that might have a value property
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return toBigInt(obj.value);
    // Some responses might be wrapped differently
    return BigInt(0);
  }
  return BigInt(0);
}

/**
 * Safely convert a value to number
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("value" in obj) return toNumber(obj.value);
  }
  return 0;
}

async function callReadOnly<T>(functionName: string, functionArgs: any[] = []): Promise<T> {
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

async function getCurrentBlockHeight(): Promise<number> {
  try {
    const response = await fetch("https://api.testnet.hiro.so/v2/info");
    const data = await response.json();
    return data.stacks_tip_height;
  } catch {
    return 0;
  }
}

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

function calculateDaysLeft(endBlock: number, currentBlock: number): number {
  if (currentBlock >= endBlock) return 0;
  const blocksLeft = endBlock - currentBlock;
  return Math.ceil(blocksLeft / BLOCKS_PER_DAY);
}

// ===========================================
// Components
// ===========================================

function DashboardProgressBar({ progress }: { progress: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          requestAnimationFrame(() => setWidth(progress));
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [progress]);

  return (
    <div className="mt-2 flex items-center gap-3" ref={barRef}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Campaign funding progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-honey-light"
          style={{ width: `${width}%`, transition: "width 1000ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </div>
      <span className="font-mono-code text-xs text-primary shrink-0">{Math.round(progress)}%</span>
    </div>
  );
}

function CountUp({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1200;
          const start = performance.now();
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(easeOut(progress) * end));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(end);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref} className="font-mono-code">{prefix}{count}{suffix}</span>;
}

const STAT_TOOLTIPS = [
  "Total campaigns you've created on BitHive",
  "Combined sBTC + STX raised across all your campaigns",
  "Percentage of your campaigns that reached their goal",
];

// ===========================================
// Data Types
// ===========================================

interface DashboardCampaign {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  goal: number;
  raised: number;
  stxRaised: number;
  status: "active" | "successful" | "failed" | "ended";
  daysLeft: number;
  isOwner: boolean;
  contribution?: number;
  stxContribution?: number;
}

// ===========================================
// Data Fetching
// ===========================================

async function fetchUserDashboardData(userAddress: string) {
  // Get current block height
  const currentBlock = await getCurrentBlockHeight();
  
  // Get total campaigns
  const nonce = await callReadOnly<number>("get-campaign-nonce");
  
  // Get creator and backer stats
  const [creatorStats, backerStats] = await Promise.all([
    callReadOnly<Record<string, unknown>>("get-creator-stats", [Cl.principal(userAddress)]),
    callReadOnly<Record<string, unknown>>("get-backer-stats", [Cl.principal(userAddress)]),
  ]);
  
  // Fetch all campaigns and filter user's data
  const myCampaigns: DashboardCampaign[] = [];
  const myContributions: DashboardCampaign[] = [];
  
  for (let i = 0; i < nonce; i++) {
    try {
      const campaignData = await callReadOnly<Record<string, unknown> | null>(
        "get-campaign",
        [Cl.uint(i)]
      );
      
      if (!campaignData) continue;
      
      const campaign: ContractCampaign = {
        owner: campaignData.owner as string,
        title: campaignData.title as string,
        description: campaignData.description as string,
        goal: toBigInt(campaignData.goal),
        raised: toBigInt(campaignData.raised),
        stxRaised: toBigInt(campaignData["stx-raised"]),
        contributorsCount: toNumber(campaignData["contributors-count"]),
        startBlock: toNumber(campaignData["start-block"]),
        endBlock: toNumber(campaignData["end-block"]),
        claimed: Boolean(campaignData.claimed),
        stxClaimed: Boolean(campaignData["stx-claimed"]),
        refundsEnabled: Boolean(campaignData["refunds-enabled"]),
        milestonesCount: toNumber(campaignData["milestones-count"]),
        milestonesCompleted: toNumber(campaignData["milestones-completed"]),
      };
      
      const isOwner = campaign.owner === userAddress;
      const status = determineCampaignStatus(campaign, currentBlock);
      const daysLeft = calculateDaysLeft(campaign.endBlock, currentBlock);
      
      const dashboardCampaign: DashboardCampaign = {
        id: i,
        title: campaign.title,
        description: campaign.description,
        imageUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
        goal: satsToBTC(campaign.goal),
        raised: satsToBTC(campaign.raised),
        stxRaised: Number(campaign.stxRaised) / 1_000_000, // STX has 6 decimals
        status,
        daysLeft,
        isOwner,
      };
      
      if (isOwner) {
        myCampaigns.push(dashboardCampaign);
      }
      
      // Check if user has contributed to this campaign
      const [sbtcContribution, stxContribution] = await Promise.all([
        callReadOnly<unknown>("get-contribution", [Cl.uint(i), Cl.principal(userAddress)]),
        callReadOnly<unknown>("get-stx-contribution", [Cl.uint(i), Cl.principal(userAddress)]),
      ]);
      
      const sbtcAmount = toNumber(sbtcContribution);
      const stxAmount = toNumber(stxContribution);
      
      if (sbtcAmount > 0 || stxAmount > 0) {
        myContributions.push({
          ...dashboardCampaign,
          contribution: satsToBTC(BigInt(sbtcAmount)),
          stxContribution: stxAmount / 1_000_000,
        });
      }
    } catch (error) {
      console.error(`Error fetching campaign ${i}:`, error);
    }
  }
  
  return {
    creatorStats: {
      campaignsCreated: toNumber(creatorStats["campaigns-created"]),
      campaignsSuccessful: toNumber(creatorStats["campaigns-successful"]),
      totalRaised: toBigInt(creatorStats["total-raised"]),
    },
    backerStats: {
      campaignsBacked: toNumber(backerStats["campaigns-backed"]),
      totalContributed: toBigInt(backerStats["total-contributed"]),
    },
    myCampaigns,
    myContributions,
  };
}

// ===========================================
// Connect Wallet Prompt
// ===========================================

function ConnectWalletPrompt() {
  const { connect, isLoading } = useWallet();
  
  return (
    <PageWrapper>
      <div className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wallet className="h-10 w-10 text-primary" />
          </motion.div>
          
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Connect Your Wallet</h1>
          <p className="mt-3 text-muted-foreground">
            Connect your Stacks testnet wallet to view your dashboard, manage campaigns, and track contributions.
          </p>
          
          <div className="mt-6 space-y-3">
            <Button
              onClick={connect}
              disabled={isLoading}
              className="w-full gap-2 glow-amber font-heading"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Make sure you're using a <strong>testnet wallet</strong> (address starting with "ST")
            </p>
          </div>
          
          <div className="mt-8 rounded-lg border border-border/50 bg-card/50 p-4">
            <h3 className="text-sm font-medium">New to Stacks?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Get a wallet like{" "}
              <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Leather
              </a>{" "}
              or{" "}
              <a href="https://xverse.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Xverse
              </a>
              , then get testnet STX from the{" "}
              <a href="https://docs.hiro.so/get-started/testnet-faucet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Hiro Faucet
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

// ===========================================
// Dashboard Component
// ===========================================

const Dashboard = () => {
  usePageTitle("Dashboard");
  const { wallet } = useWallet();
  const [tab, setTab] = useState<"campaigns" | "contributions">("campaigns");
  
  // Fetch user dashboard data
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", wallet.address],
    queryFn: () => fetchUserDashboardData(wallet.address),
    enabled: wallet.connected && !!wallet.address,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // If wallet is not connected, show connect prompt
  if (!wallet.connected) {
    return <ConnectWalletPrompt />;
  }

  const myCampaigns = data?.myCampaigns || [];
  const myContributions = data?.myContributions || [];
  const creatorStats = data?.creatorStats;
  
  const totalRaised = creatorStats ? satsToBTC(creatorStats.totalRaised) : 0;
  const successRate = creatorStats && creatorStats.campaignsCreated > 0
    ? Math.round((creatorStats.campaignsSuccessful / creatorStats.campaignsCreated) * 100)
    : 0;
  const currentList = tab === "campaigns" ? myCampaigns : myContributions;

  const stats = [
    { label: "Campaigns Created", value: creatorStats?.campaignsCreated || 0, suffix: "", display: String(creatorStats?.campaignsCreated || 0) },
    { label: "Total Raised", value: totalRaised, suffix: " sBTC", display: formatBtc(totalRaised) },
    { label: "Success Rate", value: successRate, suffix: "%", display: `${successRate}%` },
  ];

  return (
    <PageWrapper>
      <div className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your campaigns and contributions
              <span className="ml-2 text-xs text-primary/60">
                ({wallet.address.slice(0, 8)}...{wallet.address.slice(-4)})
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="gap-2 glow-amber font-heading">
              <Link to="/create"><PlusCircle className="h-4 w-4" /> Create Campaign</Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
            <p className="mt-4 text-lg font-medium">Failed to load dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again later"}
            </p>
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {stats.map((stat, i) => (
                <Tooltip key={stat.label}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    >
                      <Card className="border-border/50 bg-gradient-card cursor-default transition-colors duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(43_96%_56%/0.15)]">
                        <CardContent className="p-5 text-center">
                          <p className="text-2xl font-bold text-primary">
                            {stat.label === "Total Raised" ? (
                              <span className="font-mono-code">{stat.display}</span>
                            ) : (
                              <CountUp end={stat.value} suffix={stat.suffix} />
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border-border/50">
                    <p className="text-xs">{STAT_TOOLTIPS[i]}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-lg border border-border/50 bg-card/50 p-1" role="tablist" aria-label="Dashboard tabs">
              {(["campaigns", "contributions"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  My {t}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({t === "campaigns" ? myCampaigns.length : myContributions.length})
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            {currentList.length > 0 ? (
              <div className="space-y-3">
                {currentList.map((campaign) => {
                  const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    >
                      <Card className="border-border/50 bg-gradient-card transition-colors duration-200 hover:border-primary/20">
                        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                          <img src={campaign.imageUrl} alt={campaign.title} className="h-16 w-24 rounded-md object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading text-sm font-semibold truncate">{campaign.title}</h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 text-xs",
                                  campaign.status === "active" && "border-success/30 text-success",
                                  campaign.status === "successful" && "border-primary/30 text-primary",
                                  campaign.status === "failed" && "border-destructive/30 text-destructive"
                                )}
                              >
                                {campaign.status === "active" && <Clock className="mr-1 h-3 w-3" />}
                                {campaign.status === "successful" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                {campaign.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                                {campaign.status}
                              </Badge>
                            </div>
                            <DashboardProgressBar progress={Math.min(progress, 100)} />
                            {tab === "contributions" && (campaign.contribution || campaign.stxContribution) && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Your contribution: {campaign.contribution ? `${formatBtc(campaign.contribution)} sBTC` : ""}
                                {campaign.contribution && campaign.stxContribution ? " + " : ""}
                                {campaign.stxContribution ? `${campaign.stxContribution.toFixed(2)} STX` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button asChild variant="outline" size="sm" className="border-border/50" aria-label={`View ${campaign.title}`}>
                              <Link to={`/campaign/${campaign.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                            </Button>
                            {tab === "campaigns" && (
                              <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary">
                                <Link to={`/campaign/${campaign.id}/manage`}>Manage</Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center space-y-4">
                <Hexagon className="mx-auto h-14 w-14 text-primary/30" strokeWidth={1.5} />
                <div>
                  <p className="text-lg font-heading font-semibold text-foreground">
                    {tab === "campaigns" ? "No campaigns yet" : "No contributions yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tab === "campaigns"
                      ? "Launch your first campaign and start building with Bitcoin"
                      : "Explore campaigns and support projects you believe in"}
                  </p>
                </div>
                <Button asChild className="glow-amber font-heading">
                  <Link to={tab === "campaigns" ? "/create" : "/explore"}>
                    {tab === "campaigns" ? "Create Your First Campaign" : "Explore Campaigns"}
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

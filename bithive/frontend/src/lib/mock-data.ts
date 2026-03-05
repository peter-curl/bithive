export interface Campaign {
  id: string;
  title: string;
  description: string;
  story: string;
  category: string;
  imageUrl: string;
  goalAmount: number;
  raisedAmount: number;
  backerCount: number;
  daysLeft: number;
  creatorAddress: string;
  creatorName: string;
  status: "active" | "successful" | "failed" | "ended";
  milestones: Milestone[];
  backers: Backer[];
  updates: Update[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  completed: boolean;
}

export interface Backer {
  address: string;
  name: string;
  amount: number;
  timestamp: string;
}

export interface Update {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface WalletState {
  connected: boolean;
  address: string;
  balance: number;
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "Decentralized Solar Grid for Rural Communities",
    description: "Bringing renewable energy to off-grid villages using Bitcoin-powered microgrids and transparent funding.",
    story: "Our mission is to bring sustainable energy to communities that need it most. With sBTC funding, every contribution is tracked on-chain, ensuring full transparency. We've already identified 3 pilot villages in East Africa where solar microgrids could transform thousands of lives.",
    category: "Infrastructure",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
    goalAmount: 5.0,
    raisedAmount: 3.75,
    backerCount: 142,
    daysLeft: 18,
    creatorAddress: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    creatorName: "SolarDAO",
    status: "active",
    milestones: [
      { id: "m1", title: "Site Survey Complete", description: "Complete feasibility studies for 3 villages", amount: 1.0, completed: true },
      { id: "m2", title: "Equipment Procurement", description: "Purchase solar panels and batteries", amount: 2.0, completed: false },
      { id: "m3", title: "Installation & Training", description: "Install systems and train local operators", amount: 2.0, completed: false },
    ],
    backers: [
      { address: "SP3FBR2AGK...R8D", name: "BitcoinMaxi", amount: 0.5, timestamp: "2026-02-15T10:30:00Z" },
      { address: "SP1SJ3DTE...5BQ", name: "CryptoPhil", amount: 0.25, timestamp: "2026-02-14T08:15:00Z" },
      { address: "SP2KAF9RF...X4G", name: "StacksWhale", amount: 1.0, timestamp: "2026-02-12T14:45:00Z" },
    ],
    updates: [
      { id: "u1", title: "Milestone 1 Complete!", content: "We've finished surveying all three villages and the results are promising.", date: "2026-02-10" },
    ],
    createdAt: "2026-01-20",
  },
  {
    id: "2",
    title: "Open-Source Bitcoin Education Platform",
    description: "A free, multilingual learning platform teaching Bitcoin fundamentals to the next billion users.",
    story: "Education is the key to adoption. We're building an interactive platform with courses in 12 languages, gamified learning paths, and on-chain certification. All content will be open-source and community-maintained.",
    category: "Education",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop",
    goalAmount: 2.5,
    raisedAmount: 2.5,
    backerCount: 89,
    daysLeft: 0,
    creatorAddress: "SP3FBR2AGK5ZKP3B1ER8D6GQ3AXEFMHQ1NQBRR8D",
    creatorName: "BTCedu",
    status: "successful",
    milestones: [
      { id: "m1", title: "Curriculum Design", description: "Create course outlines for 5 modules", amount: 0.5, completed: true },
      { id: "m2", title: "Platform Development", description: "Build the learning platform", amount: 1.5, completed: true },
      { id: "m3", title: "Content & Launch", description: "Record courses and launch publicly", amount: 0.5, completed: false },
    ],
    backers: [],
    updates: [],
    createdAt: "2025-12-01",
  },
  {
    id: "3",
    title: "Bitcoin-Native Art Gallery & NFT Marketplace",
    description: "Curating digital art on Stacks with artist-first royalties and community governance.",
    story: "We believe artists deserve better. Our gallery ensures 10% perpetual royalties enforced by smart contracts, with community voting on featured exhibitions.",
    category: "Art & Culture",
    imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=400&fit=crop",
    goalAmount: 3.0,
    raisedAmount: 1.2,
    backerCount: 56,
    daysLeft: 7,
    creatorAddress: "SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    creatorName: "ArtBlocks",
    status: "active",
    milestones: [
      { id: "m1", title: "Smart Contract Audit", description: "Complete security audit of marketplace contracts", amount: 1.0, completed: true },
      { id: "m2", title: "Platform Beta", description: "Launch beta with 20 artists", amount: 1.0, completed: false },
      { id: "m3", title: "Public Launch", description: "Open marketplace to all creators", amount: 1.0, completed: false },
    ],
    backers: [],
    updates: [],
    createdAt: "2026-01-10",
  },
  {
    id: "4",
    title: "sBTC Payment Gateway for Small Businesses",
    description: "A plug-and-play payment solution enabling any small business to accept Bitcoin via sBTC.",
    story: "Small businesses are the backbone of economies worldwide. We're building an easy-to-integrate payment gateway that converts sBTC payments into local currency automatically.",
    category: "DeFi",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    goalAmount: 4.0,
    raisedAmount: 0.8,
    backerCount: 34,
    daysLeft: 25,
    creatorAddress: "SP2KAF9RF656XWKJAG8HHF0BFBHG3KZV5WX4GJ3R",
    creatorName: "PayHive",
    status: "active",
    milestones: [
      { id: "m1", title: "SDK Development", description: "Build JavaScript and Python SDKs", amount: 1.5, completed: false },
      { id: "m2", title: "Merchant Dashboard", description: "Create analytics and management dashboard", amount: 1.5, completed: false },
      { id: "m3", title: "Pilot Program", description: "Onboard 50 beta merchants", amount: 1.0, completed: false },
    ],
    backers: [],
    updates: [],
    createdAt: "2026-02-01",
  },
  {
    id: "5",
    title: "Bitcoin Mining with Renewable Energy Research",
    description: "Academic research into sustainable Bitcoin mining using geothermal and hydroelectric power sources.",
    story: "Our research team at three universities is studying the viability of renewable-powered mining operations. Findings will be published open-access.",
    category: "Research",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
    goalAmount: 1.5,
    raisedAmount: 0.3,
    backerCount: 22,
    daysLeft: 0,
    creatorAddress: "SP3FBR2AGK5ZKP3B1ER8D6GQ3AXEFMHQ1NQBRR8D",
    creatorName: "GreenMine",
    status: "failed",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2025-11-15",
  },
  {
    id: "6",
    title: "Stacks Developer Bootcamp — Africa Edition",
    description: "Training 500 developers across Africa in Clarity smart contract development with stipends.",
    story: "Africa has incredible developer talent. We're running a 12-week bootcamp in 5 cities with mentorship from core Stacks contributors.",
    category: "Education",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop",
    goalAmount: 3.5,
    raisedAmount: 2.1,
    backerCount: 78,
    daysLeft: 12,
    creatorAddress: "SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    creatorName: "AfriStacks",
    status: "active",
    milestones: [
      { id: "m1", title: "Curriculum & Mentors", description: "Finalize curriculum and recruit mentors", amount: 0.5, completed: true },
      { id: "m2", title: "Bootcamp Execution", description: "Run 12-week program in 5 cities", amount: 2.0, completed: false },
      { id: "m3", title: "Graduation & Placement", description: "Certify graduates and connect with employers", amount: 1.0, completed: false },
    ],
    backers: [],
    updates: [],
    createdAt: "2026-01-25",
  },
  {
    id: "7",
    title: "Decentralized Identity for Refugees",
    description: "Self-sovereign identity system built on Stacks enabling refugees to prove credentials without central authority.",
    story: "Millions of displaced people lack official documentation. Our DID solution lets individuals carry verifiable credentials across borders.",
    category: "Social Impact",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop",
    goalAmount: 6.0,
    raisedAmount: 4.2,
    backerCount: 203,
    daysLeft: 5,
    creatorAddress: "SP2KAF9RF656XWKJAG8HHF0BFBHG3KZV5WX4GJ3R",
    creatorName: "IDFree",
    status: "active",
    milestones: [
      { id: "m1", title: "Protocol Design", description: "Design DID protocol and credential schema", amount: 1.5, completed: true },
      { id: "m2", title: "Mobile App MVP", description: "Build mobile wallet for credential storage", amount: 2.5, completed: true },
      { id: "m3", title: "Pilot Deployment", description: "Deploy in 2 refugee camps", amount: 2.0, completed: false },
    ],
    backers: [],
    updates: [],
    createdAt: "2026-01-05",
  },
  {
    id: "8",
    title: "Lightning-Fast sBTC DEX Aggregator",
    description: "A DEX aggregator finding the best swap routes across Stacks DeFi protocols for optimal sBTC trades.",
    story: "DeFi on Stacks is growing but fragmented. Our aggregator compares rates across all major DEXs and executes multi-hop swaps in a single transaction.",
    category: "DeFi",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=400&fit=crop",
    goalAmount: 4.5,
    raisedAmount: 3.8,
    backerCount: 167,
    daysLeft: 3,
    creatorAddress: "SP3FBR2AGK5ZKP3B1ER8D6GQ3AXEFMHQ1NQBRR8D",
    creatorName: "SwapHive",
    status: "active",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2026-02-05",
  },
  {
    id: "9",
    title: "Bitcoin Podcast Network",
    description: "A decentralized podcast hosting platform with Bitcoin-native monetization via value-4-value streaming.",
    story: "Content creators deserve fair compensation. Our platform lets listeners stream sats directly to podcasters with no middleman.",
    category: "Media",
    imageUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop",
    goalAmount: 1.8,
    raisedAmount: 1.8,
    backerCount: 95,
    daysLeft: 0,
    creatorAddress: "SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    creatorName: "PodSats",
    status: "successful",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2025-12-20",
  },
  {
    id: "10",
    title: "sBTC Microlending Protocol",
    description: "Peer-to-peer microlending powered by sBTC with reputation-based credit scoring on Stacks.",
    story: "Traditional banking excludes billions. Our protocol enables trustless microloans with on-chain reputation, starting from as little as 0.001 sBTC.",
    category: "DeFi",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    goalAmount: 7.0,
    raisedAmount: 2.1,
    backerCount: 88,
    daysLeft: 30,
    creatorAddress: "SP2KAF9RF656XWKJAG8HHF0BFBHG3KZV5WX4GJ3R",
    creatorName: "MicroBTC",
    status: "active",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2026-02-10",
  },
  {
    id: "11",
    title: "Open-Source Hardware Wallet Firmware",
    description: "Community-audited firmware for DIY Bitcoin hardware wallets with Stacks transaction signing support.",
    story: "Security shouldn't be a luxury. We're building fully open-source firmware that anyone can audit, modify, and flash onto affordable hardware.",
    category: "Security",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop",
    goalAmount: 2.0,
    raisedAmount: 1.6,
    backerCount: 112,
    daysLeft: 9,
    creatorAddress: "SP3FBR2AGK5ZKP3B1ER8D6GQ3AXEFMHQ1NQBRR8D",
    creatorName: "OpenVault",
    status: "active",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2026-02-08",
  },
  {
    id: "12",
    title: "Bitcoin Climate DAO",
    description: "A DAO that funds verified carbon offset projects using sBTC treasury with transparent on-chain governance.",
    story: "Climate action needs transparency. Our DAO lets token holders vote on which carbon offset projects to fund, with all treasury movements visible on-chain.",
    category: "Social Impact",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop",
    goalAmount: 5.5,
    raisedAmount: 3.3,
    backerCount: 145,
    daysLeft: 15,
    creatorAddress: "SP1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5",
    creatorName: "ClimateDAO",
    status: "active",
    milestones: [],
    backers: [],
    updates: [],
    createdAt: "2026-02-03",
  },
];

export const MOCK_WALLET: WalletState = {
  connected: false,
  address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
  balance: 2.847,
};

export const PLATFORM_STATS = {
  totalRaised: 142.5,
  totalCampaigns: 234,
  successRate: 78,
};

export const CATEGORIES = [
  "All",
  "DeFi",
  "Education",
  "Infrastructure",
  "Art & Culture",
  "Social Impact",
  "Research",
  "Security",
  "Media",
];

export const BTC_USD_PRICE = 97500;

export function formatBtc(amount: number): string {
  return `${amount.toFixed(4)} sBTC`;
}

export function formatUsd(btcAmount: number): string {
  return `$${(btcAmount * BTC_USD_PRICE).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getProgressPercent(raised: number, goal: number): number {
  return Math.min((raised / goal) * 100, 100);
}

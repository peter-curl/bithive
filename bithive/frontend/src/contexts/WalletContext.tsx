/**
 * Wallet Context - Real Stacks Wallet Integration
 * 
 * Uses @stacks/connect for wallet authentication on testnet.
 * Supports Leather and Xverse wallets via SIP-030 standard.
 * 
 * TESTNET ONLY: This app only accepts testnet wallets (addresses starting with "ST")
 */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { 
  connect as stacksConnect, 
  disconnect as stacksDisconnect,
  isConnected as stacksIsConnected,
  getLocalStorage,
} from "@stacks/connect";
import type { AddressInfo } from "@stacks/connect";
import { toast } from "sonner";
import { STACKS_API_URL, CONTRACTS } from "@/lib/contracts";

// ===========================================
// Constants
// ===========================================

/**
 * Check if an address is a testnet address (starts with "ST")
 */
function isTestnetAddress(address: string): boolean {
  return address.startsWith("ST");
}

// ===========================================
// Types
// ===========================================

export interface WalletState {
  connected: boolean;
  address: string;
  publicKey: string;
  balance: number; // STX balance in microSTX
  sbtcBalance: number; // sBTC balance in sats
}

interface WalletContextType {
  wallet: WalletState;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

// ===========================================
// Initial State
// ===========================================

const INITIAL_WALLET: WalletState = {
  connected: false,
  address: "",
  publicKey: "",
  balance: 0,
  sbtcBalance: 0,
};

// ===========================================
// Context
// ===========================================

const WalletContext = createContext<WalletContextType | null>(null);

// ===========================================
// Provider
// ===========================================

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch STX and sBTC balances from the API
   */
  const fetchBalances = useCallback(async (address: string): Promise<{ stx: number; sbtc: number }> => {
    try {
      // Fetch STX balance and fungible token balances
      const balanceRes = await fetch(`${STACKS_API_URL}/extended/v1/address/${address}/balances`);
      if (!balanceRes.ok) throw new Error("Failed to fetch balances");
      
      const balanceData = await balanceRes.json();
      const stxBalance = parseInt(balanceData.stx?.balance || "0", 10);
      
      // Look for sBTC token using our contract address
      // The key format is "{contract_address}::{token_name}"
      let sbtcBalance = 0;
      const fungibleTokens = balanceData.fungible_tokens || {};
      
      // Check for our specific sBTC token contract
      for (const [tokenId, tokenData] of Object.entries(fungibleTokens)) {
        // Match our deployed sBTC contract or any sBTC-like token
        if (
          tokenId.includes(CONTRACTS.SBTC) ||
          tokenId.toLowerCase().includes("sbtc") ||
          tokenId.toLowerCase().includes("sip10-sbtc")
        ) {
          sbtcBalance = parseInt((tokenData as { balance: string }).balance || "0", 10);
          break;
        }
      }
      
      return { stx: stxBalance, sbtc: sbtcBalance };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { stx: 0, sbtc: 0 };
    }
  }, []);

  /**
   * Refresh wallet balances
   */
  const refreshBalance = useCallback(async () => {
    if (!wallet.address) return;
    
    const { stx, sbtc } = await fetchBalances(wallet.address);
    setWallet(prev => ({ ...prev, balance: stx, sbtcBalance: sbtc }));
  }, [wallet.address, fetchBalances]);

  /**
   * Connect to wallet using @stacks/connect
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Use connect() from @stacks/connect which shows wallet selector
      const response = await stacksConnect({
        forceWalletSelect: false, // Allow cached selection
      });
      
      // Find the STX address (index 2 in the addresses array per docs)
      const stxAddress = response.addresses.find(
        (addr: AddressInfo) => addr.symbol === "STX"
      );
      
      if (!stxAddress) {
        throw new Error("No STX address found in wallet response");
      }

      // TESTNET VALIDATION: Only allow testnet addresses
      if (!isTestnetAddress(stxAddress.address)) {
        stacksDisconnect();
        toast.error("Mainnet wallet detected", {
          description: (
            <div className="space-y-2">
              <p>BitHive is currently running on <strong>Stacks Testnet</strong>.</p>
              <p className="text-xs text-muted-foreground">
                Please switch to a testnet wallet (addresses start with "ST") to continue.
              </p>
            </div>
          ),
          duration: 8000,
        });
        throw new Error("Please connect a testnet wallet. BitHive is running on Stacks Testnet.");
      }
      
      // Fetch balances for the connected address
      const { stx, sbtc } = await fetchBalances(stxAddress.address);
      
      setWallet({
        connected: true,
        address: stxAddress.address,
        publicKey: stxAddress.publicKey || "",
        balance: stx,
        sbtcBalance: sbtc,
      });
      
      toast.success("Wallet connected", {
        description: `Connected as ${stxAddress.address.slice(0, 8)}...${stxAddress.address.slice(-4)}`,
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "Could not connect to wallet",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalances]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    stacksDisconnect();
    setWallet(INITIAL_WALLET);
    toast("Wallet disconnected");
  }, []);

  /**
   * Check for existing connection on mount
   */
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (stacksIsConnected()) {
        // Get stored addresses from local storage
        const stored = getLocalStorage();
        if (stored?.addresses) {
          const stxAddress = stored.addresses.find(
            (addr: AddressInfo) => addr.symbol === "STX"
          );
          
          if (stxAddress) {
            // Validate testnet address for existing connections too
            if (!isTestnetAddress(stxAddress.address)) {
              stacksDisconnect();
              console.log("Disconnected mainnet wallet - testnet only");
              return;
            }

            const { stx, sbtc } = await fetchBalances(stxAddress.address);
            setWallet({
              connected: true,
              address: stxAddress.address,
              publicKey: stxAddress.publicKey || "",
              balance: stx,
              sbtcBalance: sbtc,
            });
          }
        }
      }
    };
    
    checkExistingConnection();
  }, [fetchBalances]);

  return (
    <WalletContext.Provider value={{ wallet, isLoading, connect, disconnect, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

// ===========================================
// Hook
// ===========================================

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}


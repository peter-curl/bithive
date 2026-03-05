import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Campaign, formatBtc, formatUsd } from "@/lib/mock-data";
import { Loader2, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import { useContract } from "@/hooks/useContract";
import { useCampaigns } from "@/hooks/useCampaigns";

type TxState = "input" | "pending" | "success" | "error" | "wallet-required";
type TokenType = "sBTC" | "STX";

interface ContributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

// sBTC has 8 decimals, STX has 6 decimals
const SBTC_DECIMALS = 8;
const STX_DECIMALS = 6;

/**
 * Convert BTC-like decimal to sBTC micro-units (sats)
 */
function btcToSats(btc: number): bigint {
  return BigInt(Math.floor(btc * Math.pow(10, SBTC_DECIMALS)));
}

/**
 * Convert STX decimal to microSTX
 */
function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * Math.pow(10, STX_DECIMALS)));
}

/**
 * Format STX amount for display
 */
function formatStx(stx: number): string {
  return `${stx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} STX`;
}

export function ContributionModal({ open, onOpenChange, campaign }: ContributionModalProps) {
  const [amount, setAmount] = useState("0.1");
  const [tokenType, setTokenType] = useState<TokenType>("STX"); // Default to STX for testnet accessibility
  const [txState, setTxState] = useState<TxState>("input");
  const [txId, setTxId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { wallet, connect } = useWallet();
  const { contribute, contributeStx } = useContract();
  const { invalidateCampaigns } = useCampaigns();

  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * 0.025;
  const total = numAmount + fee;

  // Get user balance for selected token
  const userBalance = tokenType === "sBTC" ? wallet.sbtcBalance : wallet.stxBalance;
  const hasInsufficientBalance = wallet.connected && userBalance < total;

  useEffect(() => {
    if (txState === "success") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#EAB308", "#F59E0B", "#FBBF24", "#FDE68A"],
      });
    }
  }, [txState]);

  // Handle contribution with real contract call
  const handleContribute = async () => {
    // Check wallet connection
    if (!wallet.connected) {
      setTxState("wallet-required");
      return;
    }

    // Check sufficient balance
    if (hasInsufficientBalance) {
      const balanceDisplay = tokenType === "sBTC" ? formatBtc(userBalance) : formatStx(userBalance);
      const neededDisplay = tokenType === "sBTC" ? formatBtc(total) : formatStx(total);
      setErrorMessage(`Insufficient ${tokenType} balance. You have ${balanceDisplay} but need ${neededDisplay}`);
      setTxState("error");
      return;
    }

    setTxState("pending");
    setErrorMessage(null);

    try {
      const campaignId = parseInt(campaign.id, 10);
      let result;

      if (tokenType === "sBTC") {
        // Convert amount to sats (sBTC micro-units)
        const amountInSats = btcToSats(numAmount);
        result = await contribute(campaignId, amountInSats);
      } else {
        // Convert amount to microSTX
        const amountInMicroStx = stxToMicroStx(numAmount);
        result = await contributeStx(campaignId, amountInMicroStx);
      }

      if (result.success) {
        setTxId(result.txId || null);
        setTxState("success");
        // Invalidate campaigns cache to refresh data
        invalidateCampaigns();
      } else {
        setErrorMessage(result.error || "Transaction failed");
        setTxState("error");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed");
      setTxState("error");
    }
  };

  const handleConnectWallet = async () => {
    await connect();
    setTxState("input");
  };

  const handleClose = () => {
    setTxState("input");
    setAmount("0.1");
    setTokenType("STX");
    setTxId(null);
    setErrorMessage(null);
    onOpenChange(false);
  };

  const explorerUrl = txId 
    ? `https://explorer.hiro.so/txid/${txId}?chain=testnet`
    : null;

  // Display formatting helpers
  const formatAmount = (amt: number) => tokenType === "sBTC" ? formatBtc(amt) : formatStx(amt);
  const formatBalance = () => tokenType === "sBTC" ? formatBtc(userBalance) : formatStx(userBalance);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border/50 bg-card sm:max-w-md">
        {txState === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">Back This Project</DialogTitle>
              <DialogDescription>Contribute to "{campaign.title}"</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Token Type Selector */}
              <div>
                <label className="text-sm text-muted-foreground">Token Type</label>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    variant={tokenType === "STX" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTokenType("STX")}
                    className="flex-1"
                  >
                    STX
                    <span className="ml-1 text-xs opacity-70">(Easy to get on testnet)</span>
                  </Button>
                  <Button
                    type="button"
                    variant={tokenType === "sBTC" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTokenType("sBTC")}
                    className="flex-1"
                  >
                    sBTC
                  </Button>
                </div>
                {wallet.connected && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your balance: {formatBalance()}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contribution-amount" className="text-sm text-muted-foreground">
                  Amount ({tokenType})
                </label>
                <Input
                  id="contribution-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 font-mono-code bg-secondary border-border/50"
                  step={tokenType === "sBTC" ? "0.001" : "1"}
                  min={tokenType === "sBTC" ? "0.001" : "1"}
                />
                {tokenType === "sBTC" && (
                  <p className="mt-1 text-xs text-muted-foreground">≈ {formatUsd(numAmount)}</p>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="font-mono-code">{formatAmount(numAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (2.5%)</span>
                  <span className="font-mono-code">{formatAmount(fee)}</span>
                </div>
                <div className="border-t border-border/30 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span className="font-mono-code text-primary">{formatAmount(total)}</span>
                </div>
              </div>
              {hasInsufficientBalance && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Insufficient {tokenType} balance ({formatBalance()} available)</span>
                </div>
              )}
              <Button
                className="w-full glow-amber font-heading"
                size="lg"
                onClick={handleContribute}
                disabled={numAmount <= 0 || hasInsufficientBalance}
              >
                {wallet.connected ? `Contribute ${tokenType}` : "Connect Wallet & Contribute"}
              </Button>
            </div>
          </>
        )}

        {txState === "wallet-required" && (
          <div className="py-8 text-center space-y-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <div>
              <h3 className="font-heading text-lg font-semibold">Wallet Required</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Please connect your wallet to contribute to this campaign.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConnectWallet}>Connect Wallet</Button>
            </div>
          </div>
        )}

        {txState === "pending" && (
          <div className="py-8 text-center space-y-4">
            <div className="relative mx-auto h-12 w-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Transaction Pending</h3>
              <p className="mt-1 text-sm text-muted-foreground">Confirming on the Stacks blockchain...</p>
              <p className="mt-2 text-xs text-muted-foreground">Estimated time: 10-30 minutes</p>
            </div>
            {txId && (
              <a 
                href={explorerUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View on Explorer
              </a>
            )}
          </div>
        )}

        {txState === "success" && (
          <div className="py-8 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            </motion.div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Contribution Submitted! 🎉</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your contribution of {formatAmount(numAmount)} to "{campaign.title}" is being processed.
              </p>
            </div>
            {explorerUrl && (
              <a 
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" /> View Transaction
              </a>
            )}
            <Button onClick={handleClose} className="font-heading">Done</Button>
          </div>
        )}

        {txState === "error" && (
          <div className="py-8 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
            </motion.div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Transaction Failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMessage || "Something went wrong. Please try again."}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => { setTxState("input"); setErrorMessage(null); }}>Try Again</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

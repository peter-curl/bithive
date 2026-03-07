/**
 * Testnet Banner Component
 * 
 * A beautiful banner to notify users they're on testnet and need a testnet wallet.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ExternalLink, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TestnetBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20"
      >
        <div className="container py-2.5">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Beaker className="h-4 w-4 text-amber-500" />
              </motion.div>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Testnet Mode
              </span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <p className="hidden sm:block text-muted-foreground">
              Connect a <strong className="text-foreground">testnet wallet</strong> (address starting with "ST") to use BitHive
            </p>
            <a
              href="https://docs.hiro.so/get-started/testnet-faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline"
            >
              Get testnet STX
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 ml-auto"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
        
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 -z-10 opacity-30"
          animate={{
            background: [
              "linear-gradient(90deg, hsl(43 96% 56% / 0.1) 0%, transparent 50%, hsl(43 96% 56% / 0.1) 100%)",
              "linear-gradient(90deg, transparent 0%, hsl(43 96% 56% / 0.1) 50%, transparent 100%)",
              "linear-gradient(90deg, hsl(43 96% 56% / 0.1) 0%, transparent 50%, hsl(43 96% 56% / 0.1) 100%)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

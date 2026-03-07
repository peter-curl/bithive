import { Link, useLocation } from "react-router-dom";
import { Hexagon, Wallet, Sun, Moon, Copy, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/hooks/useWallet";
import { useTheme } from "@/components/ThemeProvider";
import { truncateAddress } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Format STX balance (microSTX to STX)
const formatStx = (microStx: number): string => {
  const stx = microStx / 1_000_000;
  if (stx >= 1000) return `${(stx / 1000).toFixed(1)}k`;
  if (stx >= 1) return stx.toFixed(2);
  return stx.toFixed(4);
};

// Format sBTC balance (sats to BTC-like display)
const formatSbtc = (sats: number): string => {
  const btc = sats / 100_000_000; // 8 decimals
  if (btc >= 1) return btc.toFixed(4);
  if (btc >= 0.001) return btc.toFixed(6);
  return btc.toFixed(8);
};

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/explore", label: "Explore" },
  { path: "/create", label: "Create" },
  { path: "/dashboard", label: "Dashboard" },
];

export function Header() {
  const { pathname } = useLocation();
  const { wallet, connect, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    toast.success("Address copied to clipboard");
  };

  const explorerUrl = `https://explorer.hiro.so/address/${wallet.address}?chain=testnet`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Hexagon className="h-8 w-8 text-primary transition-transform group-hover:rotate-12" fill="currentColor" strokeWidth={1.5} />
          <span className="font-heading text-xl font-bold text-gradient-amber">BitHive</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              aria-current={pathname === path ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </Button>

          {/* Wallet Button / Dropdown */}
          {wallet.connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="gap-2 font-mono-code text-xs"
                  size="sm"
                >
                  <Wallet className="h-4 w-4" />
                  <span>{truncateAddress(wallet.address)}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Balances Section */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Balances
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">STX</span>
                    <span className="font-mono-code font-medium">{formatStx(wallet.balance)} STX</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">sBTC</span>
                    <span className="font-mono-code font-medium text-primary">{formatSbtc(wallet.sbtcBalance)} sBTC</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyAddress} className="gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2 cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Explorer
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={disconnect} 
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connect}
              variant="default"
              className="gap-2 font-mono-code text-xs glow-amber"
              size="sm"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

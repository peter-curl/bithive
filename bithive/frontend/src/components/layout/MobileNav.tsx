import { Link, useLocation } from "react-router-dom";
import { Home, Compass, PlusCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/create", icon: PlusCircle, label: "Create" },
  { path: "/dashboard", icon: User, label: "Profile" },
];

export function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 text-xs transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }}>
                <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(43_96%_56%/0.6)]")} />
              </motion.div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

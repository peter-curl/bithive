import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-primary/20 text-primary font-semibold rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

interface SearchAutocompleteProps {
  onSearchChange: (value: string) => void;
  onSelect: (campaignId: string) => void;
}

export function SearchAutocomplete({ onSearchChange, onSelect }: SearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return MOCK_CAMPAIGNS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [debouncedQuery]);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      onSearchChange(value);
      setOpen(value.trim().length > 0);
      setActiveIndex(-1);
    },
    [onSearchChange]
  );

  const selectCampaign = useCallback(
    (id: string) => {
      setOpen(false);
      onSelect(id);
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectCampaign(suggestions[activeIndex].id);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, suggestions, activeIndex, selectCampaign]
  );

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        placeholder="Search campaigns..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => setOpen(false), 200);
        }}
        onKeyDown={handleKeyDown}
        className="pl-10 bg-card border-border/50"
        autoComplete="off"
      />
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border/50 bg-popover shadow-lg"
          >
            <ScrollArea className="max-h-[320px]">
              <div className="p-1">
                {suggestions.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2.5 cursor-pointer transition-colors",
                      activeIndex === i ? "bg-accent" : "hover:bg-accent"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearTimeout(blurTimeout.current);
                      selectCampaign(campaign.id);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="text-sm truncate">
                      {highlightMatch(campaign.title, debouncedQuery)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {campaign.category}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

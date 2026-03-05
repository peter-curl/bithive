import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignCard } from "@/components/CampaignCard";
import { CampaignCardSkeleton } from "@/components/CampaignCardSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useCampaigns } from "@/hooks/useCampaigns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "successful", label: "Successful" },
  { value: "ending-soon", label: "Ending Soon" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most-funded", label: "Most Funded" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "most-backers", label: "Most Backers" },
];

const Explore = () => {
  usePageTitle("Explore Campaigns");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);

  const { campaigns } = useCampaigns({ status: tab, category, search, sort });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [tab, category, search]);

  return (
    <PageWrapper>
      <section className="py-10 md:py-16">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold md:text-4xl">Explore Campaigns</h1>
            <p className="mt-1 text-muted-foreground">Discover projects shaping the Bitcoin ecosystem</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <SearchAutocomplete
              onSearchChange={setSearch}
              onSelect={(id) => navigate(`/campaign/${id}`)}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48 bg-card border-border/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full md:w-48 bg-card border-border/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex gap-1 overflow-x-auto rounded-lg border border-border/50 bg-card/50 p-1" role="tablist" aria-label="Campaign status filter">
            {TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  tab === t.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {campaigns.slice(0, visibleCount).map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    className="premium-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </div>
              {visibleCount < campaigns.length && (
                <div className="mt-10 text-center">
                  <Button variant="outline" className="border-primary/30" onClick={() => setVisibleCount((v) => v + 8)}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <p className="text-lg text-muted-foreground">No campaigns found matching your filters.</p>
              <Button
                variant="outline"
                className="border-primary/30"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setTab("all");
                  setSort("newest");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
};

export default Explore;

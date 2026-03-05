import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlusCircle, Eye, CheckCircle2, XCircle, Clock, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MOCK_CAMPAIGNS, formatBtc, getProgressPercent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useState, useRef, useEffect, useCallback } from "react";

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

const MY_CAMPAIGN_IDS = ["1", "3", "5"];
const MY_CONTRIBUTION_IDS = ["2", "7", "8"];

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
  "Combined sBTC raised across all your campaigns",
  "Percentage of your campaigns that reached their goal",
];

const Dashboard = () => {
  usePageTitle("Dashboard");
  const [tab, setTab] = useState<"campaigns" | "contributions">("campaigns");
  const myCampaigns = MOCK_CAMPAIGNS.filter((c) => MY_CAMPAIGN_IDS.includes(c.id));
  const myContributions = MOCK_CAMPAIGNS.filter((c) => MY_CONTRIBUTION_IDS.includes(c.id));

  const totalRaised = myCampaigns.reduce((s, c) => s + c.raisedAmount, 0);
  const successRate = Math.round((myCampaigns.filter((c) => c.status === "successful").length / Math.max(myCampaigns.length, 1)) * 100);
  const currentList = tab === "campaigns" ? myCampaigns : myContributions;

  const stats = [
    { label: "Campaigns Created", value: myCampaigns.length, suffix: "", display: myCampaigns.length.toString() },
    { label: "Total Raised", value: totalRaised, suffix: " sBTC", display: formatBtc(totalRaised) },
    { label: "Success Rate", value: successRate, suffix: "%", display: `${successRate}%` },
  ];

  return (
    <PageWrapper>
      <div className="container py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your campaigns and contributions</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="gap-2 glow-amber font-heading">
              <Link to="/create"><PlusCircle className="h-4 w-4" /> Create Campaign</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
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
            </button>
          ))}
        </div>

        {/* Content */}
        {currentList.length > 0 ? (
          <div className="space-y-3">
            {currentList.map((campaign) => {
              const progress = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);
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
                        <DashboardProgressBar progress={progress} />
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
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

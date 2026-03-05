import { useParams, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ArrowLeft, Clock, Users, Share2, ExternalLink, CheckCircle2, Circle, Trophy, Medal, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useCampaigns } from "@/hooks/useCampaigns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatBtc, formatUsd, getProgressPercent, truncateAddress } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ContributionModal } from "@/components/ContributionModal";

const CampaignDetail = () => {
  const { id } = useParams();
  const { getCampaignById } = useCampaigns();
  const campaign = getCampaignById(id || "");
  const [showContribute, setShowContribute] = useState(false);
  const hasConfetti = useRef(false);
  usePageTitle(campaign?.title || "Campaign Not Found");

  // Confetti burst for funded campaigns
  useEffect(() => {
    if (campaign?.status === "successful" && !hasConfetti.current) {
      hasConfetti.current = true;
      const timer = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { x: 0.5, y: 0.3 },
          colors: ["#EAB308", "#F59E0B", "#FBBF24", "#FDE68A", "#22C55E"],
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [campaign?.status]);

  if (!campaign) {
    return (
      <PageWrapper>
        <section className="relative flex flex-1 items-center justify-center py-20 honeycomb-bg">
          <div className="text-center space-y-6">
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto"
            >
              <Hexagon className="mx-auto h-20 w-20 text-primary" fill="currentColor" strokeWidth={1} />
            </motion.div>
            <div>
              <h1 className="font-heading text-4xl font-bold text-gradient-amber">Campaign Not Found</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                This campaign doesn't exist or may have been removed
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="glow-amber font-heading">
                <Link to="/explore">Explore Campaigns</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 font-heading">
                <Link to="/">Return to Hive</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageWrapper>
    );
  }

  const progress = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);

  return (
    <PageWrapper>
      <div className="container py-8 md:py-12">
        <Button asChild variant="ghost" size="sm" className="mb-6 gap-1 text-muted-foreground">
          <Link to="/explore"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Image + Tabs (order-2 on mobile so sidebar shows first) */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl">
              <img src={campaign.imageUrl} alt={campaign.title} className="aspect-video w-full object-cover" />
            </div>

            <Tabs defaultValue="story" className="w-full">
              <TabsList className="w-full justify-start bg-card border border-border/50">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="backers">Backers</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="mt-4">
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="p-6 text-foreground/90 leading-relaxed">
                    {campaign.story}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="mt-4">
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="p-6 space-y-4">
                    {campaign.milestones.length > 0 ? campaign.milestones.map((m) => (
                      <div key={m.id} className="flex items-start gap-3">
                        {m.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-heading font-semibold">{m.title}</h4>
                            <span className="font-mono-code text-xs text-primary">{formatBtc(m.amount)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{m.description}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No milestones set for this campaign.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="backers" className="mt-4">
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="p-6 space-y-3">
                    {campaign.backers.length > 0 ? campaign.backers.map((b, i) => (
                      <div key={b.address} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 p-3">
                        <div className="flex items-center gap-3">
                          {i === 0 ? <Trophy className="h-4 w-4 text-primary" /> : i <= 2 ? <Medal className="h-4 w-4 text-muted-foreground" /> : null}
                          <div>
                            <p className="text-sm font-medium">{b.name}</p>
                            <p className="font-mono-code text-xs text-muted-foreground">{truncateAddress(b.address)}</p>
                          </div>
                        </div>
                        <span className="font-mono-code text-sm text-primary">{formatBtc(b.amount)}</span>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No backers yet. Be the first!</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="mt-4">
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="p-6 space-y-4">
                    {campaign.updates.length > 0 ? campaign.updates.map((u) => (
                      <div key={u.id} className="border-b border-border/30 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-semibold">{u.title}</h4>
                          <span className="text-xs text-muted-foreground">{u.date}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{u.content}</p>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">No updates yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Funding Sidebar (order-1 on mobile so it shows first) */}
          <div className="space-y-4 order-1 lg:order-2">
            <Card className="sticky top-20 border-border/50 bg-gradient-card">
              <CardContent className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">{campaign.category}</Badge>
                    {campaign.status === "successful" && (
                      <Badge className="bg-success/20 text-success border-success/30 text-xs" variant="outline">
                        🎉 Funded
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-heading text-xl font-bold leading-tight">{campaign.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">by {campaign.creatorName}</p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${campaign.title} funding progress`}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-honey-light"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-primary font-mono-code">
                    {formatBtc(campaign.raisedAmount)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    of {formatBtc(campaign.goalAmount)} goal ({Math.round(progress)}%)
                  </p>
                  <p className="text-xs text-muted-foreground">≈ {formatUsd(campaign.raisedAmount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold">{campaign.backerCount}</p>
                    <p className="text-xs text-muted-foreground">Backers</p>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-secondary/30 p-3 text-center">
                    <p className="text-lg font-bold">{campaign.daysLeft > 0 ? campaign.daysLeft : "—"}</p>
                    <p className="text-xs text-muted-foreground">Days Left</p>
                  </div>
                </div>

                {campaign.status === "active" && (
                  <Button className="w-full glow-amber font-heading" size="lg" onClick={() => setShowContribute(true)}>
                    Back This Project
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost" size="sm"
                    className="gap-1 text-xs text-muted-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast("Link copied to clipboard", { description: "Share it with your network!" });
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="gap-1 text-xs text-muted-foreground"
                    onClick={() => toast("Contract explorer coming soon", { description: "On-chain contract details will be available at launch." })}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ContributionModal
        open={showContribute}
        onOpenChange={setShowContribute}
        campaign={campaign}
      />
    </PageWrapper>
  );
};

export default CampaignDetail;

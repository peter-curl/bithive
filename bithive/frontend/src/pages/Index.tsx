import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Hexagon, Shield, Zap, Eye, Wallet, PenTool, Rocket, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignCard } from "@/components/CampaignCard";
import { HeroDashboardMockup } from "@/components/HeroDashboardMockup";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useCampaigns } from "@/hooks/useCampaigns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePlatformStats } from "@/hooks/usePlatformStats";

function CountUp({ end, suffix = "", prefix = "", decimals = 0 }: { end: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = easeOut(progress);
            setCount(eased * end);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setCount(end);
              setDone(true);
            }
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return (
    <motion.span
      ref={ref}
      className="font-mono-code inline-block"
      animate={done ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}

const HEXAGON_CONFIG = [
  { left: "10%", top: "15%", size: "h-14 w-14 md:h-20 md:w-20", speed: 0.3 },
  { left: "25%", top: "55%", size: "h-10 w-10 md:h-14 md:w-14", speed: 0.5 },
  { left: "45%", top: "25%", size: "h-12 w-12 md:h-16 md:w-16", speed: 0.2 },
  { left: "65%", top: "60%", size: "h-10 w-10 md:h-14 md:w-14", speed: 0.6 },
  { left: "80%", top: "20%", size: "h-14 w-14 md:h-18 md:w-18", speed: 0.35 },
  { left: "90%", top: "50%", size: "h-8 w-8 md:h-12 md:w-12", speed: 0.45 },
];

function FloatingHexagons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {HEXAGON_CONFIG.map((hex, i) => (
        <ParallaxHexagon key={i} config={hex} index={i} scrollY={scrollY} />
      ))}
    </div>
  );
}

function ParallaxHexagon({ config, index, scrollY }: { config: typeof HEXAGON_CONFIG[number]; index: number; scrollY: any }) {
  const y = useTransform(scrollY, [0, 800], [0, -120 * config.speed]);
  const x = useTransform(scrollY, [0, 800], [0, (index % 2 === 0 ? 1 : -1) * 30 * config.speed]);
  const rotate = useTransform(scrollY, [0, 800], [0, (index % 2 === 0 ? 15 : -15) * config.speed]);

  return (
    <motion.div
      className="absolute text-primary/15"
      style={{ left: config.left, top: config.top, y, x, rotate }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: index * 0.15 }}
    >
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
      >
        <Hexagon className={config.size} strokeWidth={1} />
      </motion.div>
    </motion.div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    desc: "Link your Stacks wallet in one click. Your keys, your funds — always in control.",
    step: "01",
  },
  {
    icon: PenTool,
    title: "Create or Discover",
    desc: "Launch a campaign in minutes or explore projects pushing Bitcoin's boundaries.",
    step: "02",
  },
  {
    icon: Rocket,
    title: "Fund with sBTC",
    desc: "Back projects with sBTC. Smart contracts release funds as milestones are hit — transparent and trustless.",
    step: "03",
  },
  {
    icon: Trophy,
    title: "Celebrate & Claim",
    desc: "Once the goal is met, creators claim funds and backers share in the success. Fully on-chain.",
    step: "04",
  },
];

const TRUST = [
  { icon: Shield, title: "Secured by Bitcoin", desc: "Every transaction backed by Bitcoin's security" },
  { icon: Zap, title: "Instant Settlements", desc: "sBTC enables fast, low-cost transactions" },
  { icon: Eye, title: "Transparent Fees", desc: "On-chain accountability, no hidden costs" },
];

function HowItWorksSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} id="how-it-works" className="relative border-y border-border/50 bg-card/20 py-20 md:py-28 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 honeycomb-bg opacity-30" />
      
      <div className="container relative z-10">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-medium uppercase tracking-widest text-primary">Simple Process</span>
          <h2 className="mt-2 font-heading text-3xl font-bold md:text-4xl">
            How <span className="text-gradient-amber">BitHive</span> Works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Four steps from idea to funded project — powered by Bitcoin
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          {/* Connecting line */}
          <div className="absolute top-16 left-[16.67%] right-[16.67%] hidden md:block">
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            />
          </div>

          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
            >
              {/* Step number */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono-code text-5xl font-bold text-primary/10">
                {step.step}
              </span>

              {/* Icon */}
              <motion.div
                className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
                whileHover={{ scale: 1.1, borderColor: "hsl(43 96% 56% / 0.5)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <step.icon className="h-8 w-8 text-primary" />
                <div className="absolute -inset-1 rounded-2xl bg-primary/5 blur-lg" />
              </motion.div>

              <h3 className="mt-6 font-heading text-xl font-semibold">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Button asChild size="lg" className="glow-amber gap-2 font-heading">
            <Link to="/explore">
              Start Exploring <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Platform Stats Section - Shows real-time stats from the contract
 */
function PlatformStatsSection() {
  const { totalRaised, totalCampaigns, successRate, isLoading } = usePlatformStats();

  const stats = [
    { label: "Total Raised", value: totalRaised, suffix: " sBTC", decimals: 1 },
    { label: "Campaigns Funded", value: totalCampaigns, suffix: "", decimals: 0 },
    { label: "Success Rate", value: successRate, suffix: "%", decimals: 0 },
  ];

  return (
    <section aria-label="Platform statistics" className="border-y border-border/50 bg-card/30 py-10">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="border-border/50 bg-gradient-card text-center transition-colors duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(43_96%_56%/0.15)]">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary md:text-4xl">
                    {isLoading ? (
                      <span className="inline-block h-10 w-20 animate-pulse rounded bg-primary/20" />
                    ) : (
                      <CountUp end={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Index = () => {
  usePageTitle("");
  const { featuredCampaigns } = useCampaigns();

  return (
    <PageWrapper>
      {/* Hero */}
      <section aria-label="Hero" className="relative overflow-hidden py-20 md:py-32 honeycomb-bg">
        <FloatingHexagons />
        {/* Radial glow behind hero */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(43_96%_56%/0.08)_0%,transparent_70%)]" />
        </div>
        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
              Fund the Future with{" "}
              <span className="text-gradient-amber relative">
                Bitcoin
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%] rounded" />
              </span>
            </h1>
            <motion.p
              className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Back innovative projects with sBTC. Transparent milestones, on-chain accountability,
              and the security of the world's strongest blockchain.
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="glow-amber gap-2 font-heading">
                <Link to="/explore">
                  Explore Campaigns <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 font-heading border-primary/30 hover:border-primary/60">
                <Link to="/create">
                  Create Campaign <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Dashboard Mockup */}
            <motion.div
              className="mt-12 md:mt-16"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <HeroDashboardMockup />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Platform Stats */}
      <PlatformStatsSection />

      {/* Featured Campaigns */}
      <section aria-label="Featured campaigns" className="py-14 md:py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">Featured Campaigns</h2>
              <p className="mt-1 text-sm text-muted-foreground">Trending projects backed by the community</p>
            </div>
            <Button asChild variant="ghost" className="gap-1 text-primary">
              <Link to="/explore">View all <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCampaigns.map((campaign, i) => (
              <motion.div
                key={campaign.id}
                className="premium-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <CampaignCard campaign={campaign} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Enhanced */}
      <HowItWorksSection />

      {/* Trust Indicators */}
      <section aria-label="Trust indicators" className="py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRUST.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="group border-border/50 bg-gradient-card transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_hsl(43_96%_56%/0.15)] hover:-translate-y-1">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-label="Call to action" className="border-t border-border/50 bg-card/30 py-14 md:py-16">
        <div className="container text-center">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">
            Ready to <span className="text-gradient-amber">Build the Future</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join hundreds of innovators funding projects with the power of Bitcoin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="glow-amber gap-2 font-heading">
              <Link to="/create">Start Your Campaign <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default Index;

import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const DATA_SETS = [
  [
    { x: 0, v: 20 }, { x: 1, v: 35 }, { x: 2, v: 28 },
    { x: 3, v: 45 }, { x: 4, v: 52 }, { x: 5, v: 48 }, { x: 6, v: 60 },
  ],
  [
    { x: 0, v: 25 }, { x: 1, v: 40 }, { x: 2, v: 32 },
    { x: 3, v: 50 }, { x: 4, v: 58 }, { x: 5, v: 55 }, { x: 6, v: 68 },
  ],
  [
    { x: 0, v: 30 }, { x: 1, v: 28 }, { x: 2, v: 42 },
    { x: 3, v: 38 }, { x: 4, v: 62 }, { x: 5, v: 50 }, { x: 6, v: 72 },
  ],
  [
    { x: 0, v: 22 }, { x: 1, v: 38 }, { x: 2, v: 30 },
    { x: 3, v: 48 }, { x: 4, v: 55 }, { x: 5, v: 60 }, { x: 6, v: 65 },
  ],
];

const GRADIENT_COLORS = [
  { start: "hsl(43, 96%, 56%)", end: "hsl(43, 96%, 56%)" },
  { start: "hsl(38, 96%, 52%)", end: "hsl(43, 96%, 56%)" },
  { start: "hsl(33, 96%, 50%)", end: "hsl(38, 96%, 52%)" },
  { start: "hsl(38, 96%, 52%)", end: "hsl(43, 96%, 56%)" },
];

const STAT_SETS = [
  { raised: 12.4, campaigns: 24, backers: 156 },
  { raised: 13.1, campaigns: 26, backers: 163 },
  { raised: 14.2, campaigns: 27, backers: 171 },
  { raised: 13.6, campaigns: 25, backers: 168 },
];

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) { setDisplay(value); return; }
    const duration = 800;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</span>;
}

export function HeroDashboardMockup() {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const isMobile = useIsMobile();

  const rotateXMotion = useMotionValue(0);
  const rotateYMotion = useMotionValue(0);
  const rotateX = useSpring(rotateXMotion, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rotateYMotion, { stiffness: 150, damping: 20 });

  const glareX = useTransform(rotateYMotion, [-8, 8], [20, 80]);
  const glareY = useTransform(rotateXMotion, [8, -8], [20, 80]);
  const glareOpacity = useTransform(
    rotateXMotion,
    [-8, 0, 8],
    [0.12, 0, 0.12]
  );
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.35), transparent 60%)`
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % DATA_SETS.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    rotateXMotion.set(-normalizedY * 8);
    rotateYMotion.set(normalizedX * 8);
  }, [isMobile, rotateXMotion, rotateYMotion]);

  const handleMouseLeave = useCallback(() => {
    rotateXMotion.set(0);
    rotateYMotion.set(0);
  }, [rotateXMotion, rotateYMotion]);

  const colors = GRADIENT_COLORS[index];
  const stats = STAT_SETS[index];

  return (
    <div
      className="mx-auto w-full max-w-2xl max-md:max-w-sm"
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
      <motion.div
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-2xl backdrop-blur-sm"
        style={
          !isMobile
            ? { rotateX, rotateY, transformPerspective: 800 }
            : undefined
        }
      >
        {/* Glare overlay */}
        {!isMobile && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
            style={{
              opacity: glareOpacity,
              background: glareBackground,
            }}
          />
        )}

        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">BitHive Dashboard</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] font-medium text-green-500">Live</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30">
          {[
            { label: "Total Raised", value: stats.raised, suffix: " sBTC", decimals: 1 },
            { label: "Active Campaigns", value: stats.campaigns, suffix: "", decimals: 0 },
            { label: "Live Backers", value: stats.backers, suffix: "", decimals: 0 },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-3 text-center md:px-4">
              <div className="text-sm font-bold text-primary md:text-base">
                <AnimatedNumber value={stat.value} decimals={stat.decimals} />
                {stat.suffix}
              </div>
              <div className="text-[10px] text-muted-foreground md:text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-24 px-2 pb-2 pt-1 md:h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA_SETS[index]} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={colors.start}
                    stopOpacity={0.6}
                    style={{ transition: "stop-color 1.5s ease-in-out" }}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors.end}
                    stopOpacity={0.05}
                    style={{ transition: "stop-color 1.5s ease-in-out" }}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={colors.start}
                strokeWidth={2}
                fill="url(#heroGradient)"
                animationDuration={1500}
                style={{ transition: "stroke 1.5s ease-in-out" } as React.CSSProperties}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

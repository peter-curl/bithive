import { Hexagon } from "lucide-react";

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background">
    <div className="relative">
      <div className="absolute -inset-4 rounded-full bg-primary/10 animate-pulse-glow blur-xl" />
      <Hexagon className="h-14 w-14 text-primary animate-float" fill="currentColor" strokeWidth={1} />
    </div>
    <p className="mt-4 text-sm font-heading text-gradient-amber animate-pulse">Loading...</p>
  </div>
);

export default LoadingFallback;

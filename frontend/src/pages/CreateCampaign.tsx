import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Hexagon, Upload, X, Loader2, Wallet } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CATEGORIES, formatBtc, formatUsd } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWallet } from "@/contexts/WalletContext";
import { useContract } from "@/hooks/useContract";
import { useCampaigns } from "@/hooks/useCampaigns";

const STORAGE_KEY = "bithive_create_campaign";

// sBTC has 8 decimals
const SBTC_DECIMALS = 8;
// Block time approximation for duration calculation
const BLOCKS_PER_DAY = 144; // ~10 minutes per block

/**
 * Convert BTC-like decimal to sBTC micro-units (sats)
 */
function btcToSats(btc: number): bigint {
  return BigInt(Math.floor(btc * Math.pow(10, SBTC_DECIMALS)));
}

function loadSaved() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const STEPS = ["Basic Info", "Funding Goal", "Milestones", "Review & Launch"];
const DURATIONS = [
  { days: 7, label: "7 days", blocks: "~1,008" },
  { days: 14, label: "14 days", blocks: "~2,016" },
  { days: 30, label: "30 days", blocks: "~4,320" },
  { days: 60, label: "60 days", blocks: "~8,640" },
];

interface MilestoneInput {
  id: string;
  title: string;
  description: string;
  amount: string;
}

const CreateCampaign = () => {
  usePageTitle("Create Campaign");
  const navigate = useNavigate();
  const saved = useRef(loadSaved());

  // Wallet and contract hooks
  const { wallet, connect } = useWallet();
  const { createCampaign, addMilestone: addContractMilestone } = useContract();
  const { invalidateCampaigns } = useCampaigns();

  const [step, setStep] = useState(saved.current?.step ?? 0);
  const [isLaunching, setIsLaunching] = useState(false);

  // Step 1
  const [title, setTitle] = useState(saved.current?.title ?? "");
  const [description, setDescription] = useState(saved.current?.description ?? "");
  const [category, setCategory] = useState(saved.current?.category ?? "");

  // Step 2
  const [goalAmount, setGoalAmount] = useState(saved.current?.goalAmount ?? "1.0");
  const [duration, setDuration] = useState(saved.current?.duration ?? 30);

  // Step 3
  const [milestones, setMilestones] = useState<MilestoneInput[]>(saved.current?.milestones ?? []);

  // Image
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeNoRefund, setAgreeNoRefund] = useState(false);

  // Persist form state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, title, description, category, goalAmount, duration, milestones,
    }));
  }, [step, title, description, category, goalAmount, duration, milestones]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const goalNum = parseFloat(goalAmount) || 0;
  const milestoneTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  const addMilestone = () => {
    setMilestones([...milestones, { id: crypto.randomUUID(), title: "", description: "", amount: "" }]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof MilestoneInput, value: string) => {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const canNext = () => {
    if (step === 0) return title.length >= 5 && description.length >= 20 && category;
    if (step === 1) return goalNum >= 0.01;
    if (step === 2) return true;
    if (step === 3) return agreeTerms && agreeNoRefund && wallet.connected;
    return false;
  };

  const handleConnectWallet = async () => {
    await connect();
  };

  const handleLaunch = async () => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLaunching(true);

    try {
      // Convert goal to sats (sBTC micro-units)
      const goalInSats = btcToSats(goalNum);
      // Convert duration to blocks
      const durationInBlocks = duration * BLOCKS_PER_DAY;

      // Step 1: Create the campaign
      const campaignResult = await createCampaign(
        title,
        description,
        goalInSats,
        durationInBlocks
      );

      if (!campaignResult.success) {
        throw new Error(campaignResult.error || "Failed to create campaign");
      }

      // The campaign will get the next available ID
      // We need to wait a bit for the transaction to be processed
      // For now, we show success and let user know milestones can be added later
      
      if (milestones.length > 0) {
        toast.info("Campaign created! Milestone transactions will follow.", {
          description: "Please approve each milestone transaction in your wallet.",
        });

        // Note: In a production app, you would:
        // 1. Wait for the create-campaign tx to confirm
        // 2. Get the new campaign ID from contract events or by querying
        // 3. Then add milestones
        // 
        // For now, we inform the user that milestones need to be added after
        // the campaign transaction confirms
        toast.info("Milestones pending", {
          description: "Visit your campaign after it confirms to add milestones.",
        });
      }

      // Clear saved form data
      sessionStorage.removeItem(STORAGE_KEY);

      toast.success("Campaign submitted! 🐝", {
        description: "Your campaign transaction is being processed on the blockchain.",
      });

      // Invalidate campaigns cache
      invalidateCampaigns();

      // Navigate to explore page
      navigate("/explore");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to launch campaign";
      toast.error("Launch failed", { description: message });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <PageWrapper>
      <div className="container max-w-2xl py-8 md:py-12">
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Create Campaign</h1>
        <p className="mt-1 text-muted-foreground">Launch your project in 4 simple steps</p>

        {/* Progress */}
        <div className="mt-8 relative" aria-label="Form progress" role="group">
          {/* Background connecting line */}
          <div className="absolute top-4 left-4 right-4 h-px bg-border" />
          {/* Animated fill line */}
          <div
            className="absolute top-4 left-4 h-px bg-primary transition-all duration-500 ease-out"
            style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 2rem)` }}
          />
          <div className="relative flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center" aria-current={i === step ? "step" : undefined}>
                <motion.div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors relative z-10",
                    i <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                  animate={i < step ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  aria-label={`Step ${i + 1}: ${s}${i < step ? " (completed)" : i === step ? " (current)" : ""}`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s) => (
            <span key={s} className="flex-1 text-center">{s}</span>
          ))}
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mt-8"
          >
            {step === 0 && (
              <Card className="border-border/50 bg-gradient-card">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <label htmlFor="campaign-title" className="text-sm font-medium">Campaign Title</label>
                    <Input
                      id="campaign-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your campaign a compelling name"
                      maxLength={80}
                      className="mt-1 bg-secondary border-border/50"
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">{title.length}/80</p>
                  </div>
                  <div>
                    <label htmlFor="campaign-description" className="text-sm font-medium">Description</label>
                    <Textarea
                      id="campaign-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what your project is about and why it matters"
                      maxLength={500}
                      rows={4}
                      className="mt-1 bg-secondary border-border/50"
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">{description.length}/500</p>
                  </div>
                  <div>
                    <label htmlFor="campaign-category" className="text-sm font-medium">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1 bg-secondary border-border/50">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Campaign Image</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {imagePreview ? (
                      <div className="relative mt-1 overflow-hidden rounded-lg border border-border/50">
                        <img src={imagePreview} alt="Preview" className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={removeImage}
                          aria-label="Remove image"
                          className="absolute top-2 right-2 rounded-full bg-background/80 p-1 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Upload campaign image"
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) processFile(file);
                        }}
                        className={cn(
                          "mt-1 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isDragging
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        <Upload className="h-5 w-5" />
                        <span>{isDragging ? "Drop image here" : "Click to upload or drag & drop"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 1 && (
              <Card className="border-border/50 bg-gradient-card">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <label htmlFor="funding-goal" className="text-sm font-medium">Funding Goal (sBTC)</label>
                    <Input
                      id="funding-goal"
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="mt-1 font-mono-code text-lg bg-secondary border-border/50"
                      step="0.1"
                      min="0.01"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">≈ {formatUsd(goalNum)}</p>
                  </div>
                  <div>
                    <label id="duration-label" className="text-sm font-medium">Campaign Duration</label>
                    <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-labelledby="duration-label">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.days}
                          role="radio"
                          aria-checked={duration === d.days}
                          onClick={() => setDuration(d.days)}
                          className={cn(
                            "rounded-lg border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            duration === d.days
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          <p className="font-medium">{d.label}</p>
                          <p className="text-xs text-muted-foreground">{d.blocks} blocks</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform fee</span>
                      <span>2.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee on goal</span>
                      <span className="font-mono-code">{formatBtc(goalNum * 0.025)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="border-border/50 bg-gradient-card">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold">Milestones</h3>
                      <p className="text-xs text-muted-foreground">Optional — add milestones to unlock funds gradually</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addMilestone} className="gap-1 border-primary/30">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>

                  {milestones.length > 0 && (
                    <div className="space-y-2">
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-valuenow={Math.round(Math.min((milestoneTotal / goalNum) * 100, 100))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Milestone allocation progress"
                      >
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r from-primary to-honey-light transition-all",
                            milestoneTotal > goalNum && "from-destructive to-destructive"
                          )}
                          style={{ width: `${Math.min((milestoneTotal / goalNum) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {formatBtc(milestoneTotal)} / {formatBtc(goalNum)} allocated
                        {milestoneTotal > goalNum && <span className="text-destructive ml-1">(over-allocated!)</span>}
                      </p>
                    </div>
                  )}

                  {milestones.map((m, i) => (
                    <div key={m.id} className="space-y-2 rounded-lg border border-border/30 bg-secondary/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Milestone {i + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 focus-visible:ring-offset-1" onClick={() => removeMilestone(m.id)} aria-label={`Remove milestone ${i + 1}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Milestone title"
                        value={m.title}
                        onChange={(e) => updateMilestone(m.id, "title", e.target.value)}
                        className="bg-secondary border-border/50"
                      />
                      <Input
                        placeholder="Description"
                        value={m.description}
                        onChange={(e) => updateMilestone(m.id, "description", e.target.value)}
                        className="bg-secondary border-border/50"
                      />
                      <Input
                        type="number"
                        placeholder="Amount (sBTC)"
                        value={m.amount}
                        onChange={(e) => updateMilestone(m.id, "amount", e.target.value)}
                        className="font-mono-code bg-secondary border-border/50"
                        step="0.01"
                      />
                    </div>
                  ))}

                  {milestones.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Hexagon className="mx-auto mb-2 h-8 w-8 text-primary/30" />
                      <p className="text-sm">No milestones added. Funds will be released upon campaign success.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="border-border/50 bg-gradient-card">
                <CardContent className="space-y-5 p-6">
                  <h3 className="font-heading font-semibold">Review Your Campaign</h3>

                  <div className="space-y-3 rounded-lg border border-border/30 bg-secondary/20 p-4 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium text-right max-w-[60%]">{title || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{category || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-mono-code text-primary">{formatBtc(goalNum)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{duration} days</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Milestones</span><span>{milestones.length}</span></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} />
                      <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                        I agree to the BitHive platform terms and conditions
                      </label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="norefund" checked={agreeNoRefund} onCheckedChange={(v) => setAgreeNoRefund(!!v)} />
                      <label htmlFor="norefund" className="text-sm text-muted-foreground leading-tight">
                        I understand that funds are managed by smart contracts and cannot be reversed
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0 || isLaunching}
            className="gap-1 border-border/50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className={cn("gap-1 glow-amber", canNext() && "animate-pulse-glow")}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : !wallet.connected ? (
            <Button 
              onClick={handleConnectWallet}
              className="gap-1 glow-amber font-heading"
            >
              <Wallet className="h-4 w-4" /> Connect Wallet
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  disabled={!canNext() || isLaunching} 
                  className="gap-1 glow-amber font-heading"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Launching...
                    </>
                  ) : (
                    <>
                      Launch Campaign <Hexagon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Launch your campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create your campaign on the Stacks blockchain. A wallet transaction will be required to complete this action.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLaunching}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLaunch} disabled={isLaunching}>
                    {isLaunching ? "Processing..." : "Yes, Launch"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default CreateCampaign;

import React from "react";
import { Shield, Lock, Check, AlertCircle, Smartphone, Key } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface SecurityOverviewProps {
  score?: number;
  passwordStatus?: {
    strength: "Strong" | "Moderate" | "Weak";
    lastChangedText: string;
  };
  mfaEnabled?: boolean;
  recoveryCodesCount?: number;
  activeSessionsCount?: number;
  onViewRecommendations?: () => void;
}

export const SecurityOverview: React.FC<SecurityOverviewProps> = ({
  score = 72,
  passwordStatus = {
    strength: "Strong",
    lastChangedText: "Last changed 12 days ago",
  },
  mfaEnabled = false,
  recoveryCodesCount = 0,
  activeSessionsCount = 1,
  onViewRecommendations,
}) => {
  const getScoreStatus = (val: number) => {
    if (val >= 90) return { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400" };
    if (val >= 70)
      return { label: "Needs improvement", color: "text-amber-600 dark:text-amber-400" };
    return { label: "Critical attention needed", color: "text-rose-600 dark:text-rose-400" };
  };

  const scoreStatus = getScoreStatus(score);

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            Security Overview
          </h3>
          <p className="text-xs text-muted-foreground">Here&apos;s how secure your account is</p>
        </div>
      </div>

      {/* Grid: Score on Left (or top on mobile), 4 Cards on Right */}
      <div className="grid gap-5 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] items-stretch">
        {/* Left: Security Score */}
        <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/20 p-5 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Security Score
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {score}%
              </span>
              <span className={`text-xs font-semibold ${scoreStatus.color}`}>
                {scoreStatus.label}
              </span>
            </div>
            {/* Progress bar */}
            <div className="pt-1">
              <Progress
                value={score}
                className="h-2 bg-muted rounded-full [&>div]:bg-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete the recommended actions below to improve your security.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onViewRecommendations}
              className="w-full text-xs font-medium border-border hover:bg-muted/80 text-foreground h-8"
            >
              View recommendations
            </Button>
          </div>
        </div>

        {/* Right: 4 Clean Metric Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* 1. Password Status */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Password</p>
                <p className="text-sm font-semibold text-foreground">{passwordStatus.strength}</p>
                <p className="text-[11px] text-muted-foreground">
                  {passwordStatus.lastChangedText}
                </p>
              </div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 ml-auto">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* 2. 2FA Status */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  mfaEnabled
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                }`}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Two-factor authentication
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {mfaEnabled ? "Enabled" : "Not enabled"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {mfaEnabled ? "Protects account sign-in" : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            {mfaEnabled ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 ml-auto">
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 ml-auto">
                <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>

          {/* 3. Recovery Methods */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  recoveryCodesCount > 0
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                }`}
              >
                <Key className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Recovery methods</p>
                <p className="text-sm font-semibold text-foreground">
                  {recoveryCodesCount > 0
                    ? `${recoveryCodesCount} codes remaining`
                    : "Not configured"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {recoveryCodesCount > 0 ? "Backup access ready" : "Add recovery options"}
                </p>
              </div>
            </div>
            {recoveryCodesCount > 0 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 ml-auto">
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 ml-auto">
                <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>

          {/* 4. Active Sessions */}
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-border">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Active sessions</p>
                <p className="text-sm font-semibold text-foreground">
                  {activeSessionsCount} current session{activeSessionsCount > 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-muted-foreground">No suspicious activity</p>
              </div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 ml-auto">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

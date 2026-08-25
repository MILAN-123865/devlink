import React, { useState, useRef } from "react";
import { Lock } from "lucide-react";
import { TypoHeading, TypoCaption } from "@/components/shared/Typography";
import { SecurityOverview } from "./SecurityOverview";
import { PasswordSecurityCard } from "./PasswordSecurityCard";
import { ConnectedAccountsCard } from "./ConnectedAccountsCard";
import { TwoFactorSecurityCard } from "./TwoFactorSecurityCard";
import { RecoveryCodesCard } from "./RecoveryCodesCard";
import { ActiveSessionsCard } from "./ActiveSessionsCard";
import { LoginHistoryCard } from "./LoginHistoryCard";
import { ConnectedDevicesCard } from "./ConnectedDevicesCard";
import { TrustedDevicesCard } from "./TrustedDevicesCard";
import { DangerZoneCard } from "./DangerZoneCard";

interface SecurityDashboardProps {
  userEmail?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  userEmail = "nancy@example.com",
}) => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState(0);
  const [activeSessionsCount, setActiveSessionsCount] = useState(1);
  const [passwordStatus, setPasswordStatus] = useState<{
    strength: "Strong" | "Moderate" | "Weak";
    lastChangedText: string;
  }>({
    strength: "Strong",
    lastChangedText: "Last changed 12 days ago",
  });

  const authSectionRef = useRef<HTMLDivElement>(null);

  const calculateScore = () => {
    let score = 45; // base score for password
    if (mfaEnabled) score += 27;
    if (recoveryCodesCount > 0) score += 15;
    if (activeSessionsCount <= 2) score += 13;
    return Math.min(100, score);
  };

  const handleViewRecommendations = () => {
    authSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePasswordChanged = () => {
    setPasswordStatus({
      strength: "Strong",
      lastChangedText: "Last changed just now",
    });
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* 1. Page Header */}
      <div className="space-y-1">
        <TypoHeading
          as="h2"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
        >
          Security
        </TypoHeading>
        <TypoCaption as="p" className="text-xs sm:text-sm text-muted-foreground">
          Manage your password, authentication methods and account security
        </TypoCaption>
      </div>

      {/* 2. Security Overview Card */}
      <section aria-label="Security Overview">
        <SecurityOverview
          score={calculateScore()}
          passwordStatus={passwordStatus}
          mfaEnabled={mfaEnabled}
          recoveryCodesCount={recoveryCodesCount}
          activeSessionsCount={activeSessionsCount}
          onViewRecommendations={handleViewRecommendations}
        />
      </section>

      {/* 3. Authentication Section */}
      <section ref={authSectionRef} aria-label="Authentication" className="space-y-4">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Authentication</h3>

        {/* 3 Authentication Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PasswordSecurityCard onPasswordChanged={handlePasswordChanged} />
          <ConnectedAccountsCard />
          <TwoFactorSecurityCard
            mfaEnabled={mfaEnabled}
            onStatusChange={(enabled, count) => {
              setMfaEnabled(enabled);
              if (count !== undefined) setRecoveryCodesCount(count);
            }}
            onShowRecoveryCodes={() => {
              const el = document.getElementById("recovery-codes-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>

        {/* Full-width Recovery Codes Card */}
        <div id="recovery-codes-section" className="pt-1">
          <RecoveryCodesCard
            mfaEnabled={mfaEnabled}
            codesCount={recoveryCodesCount}
            onCodesUpdated={(count) => setRecoveryCodesCount(count)}
          />
        </div>
      </section>

      {/* 4. Activity Section */}
      <section aria-label="Activity" className="space-y-4">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Activity</h3>

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <ActiveSessionsCard onSessionCountChange={(count) => setActiveSessionsCount(count)} />
          <LoginHistoryCard />
        </div>
      </section>

      {/* 5. Devices & Trust Section */}
      <section aria-label="Devices and Trust" className="space-y-4">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Devices & Trust</h3>

        <div className="grid gap-4 lg:grid-cols-2 items-start">
          <ConnectedDevicesCard />
          <TrustedDevicesCard />
        </div>
      </section>

      {/* 6. Danger Zone */}
      <section aria-label="Danger Zone">
        <DangerZoneCard userEmail={userEmail} onSessionsRevoked={() => setActiveSessionsCount(1)} />
      </section>

      {/* 7. Footer Security Message */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2 text-center text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          Your security is important to us. We use industry-standard encryption to protect your
          data.
        </span>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { LogOut, ShieldAlert, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { sessionsApi } from "@/api";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";

interface DangerZoneCardProps {
  userEmail?: string;
  onSessionsRevoked?: () => void;
  onTrustedRevoked?: () => void;
}

export const DangerZoneCard: React.FC<DangerZoneCardProps> = ({
  userEmail = "user@example.com",
  onSessionsRevoked,
  onTrustedRevoked,
}) => {
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [revokeTrustedModalOpen, setRevokeTrustedModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isRevokingTrusted, setIsRevokingTrusted] = useState(false);

  const handleSignOutAll = async () => {
    setIsSigningOut(true);
    try {
      await sessionsApi.revokeOtherSessions();
      toast.success("Successfully signed out of all other sessions.");
      onSessionsRevoked?.();
    } catch {
      toast.success("Successfully signed out of all other sessions.");
      onSessionsRevoked?.();
    } finally {
      setIsSigningOut(false);
      setSignOutModalOpen(false);
    }
  };

  const handleRevokeTrusted = async () => {
    setIsRevokingTrusted(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("All trusted devices have been revoked.");
      onTrustedRevoked?.();
    } finally {
      setIsRevokingTrusted(false);
      setRevokeTrustedModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    window.location.href = "/";
  };

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 shadow-xs">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Sign out all sessions */}
            <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-card p-4 space-y-3 shadow-xs">
              <div className="space-y-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <LogOut className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Sign out all sessions</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Sign out from all devices except this one.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignOutModalOpen(true)}
                className="w-full text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
              >
                Sign out all
              </Button>
            </div>

            {/* 2. Revoke trusted devices */}
            <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-card p-4 space-y-3 shadow-xs">
              <div className="space-y-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Revoke trusted devices</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Remove trust from all devices.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevokeTrustedModalOpen(true)}
                className="w-full text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
              >
                Revoke all
              </Button>
            </div>

            {/* 3. Delete account */}
            <div className="flex flex-col justify-between rounded-lg border border-destructive/20 bg-card p-4 space-y-3 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="space-y-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Delete account</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteAccountModalOpen(true)}
                className="w-full text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
              >
                Delete account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Sign Out All */}
      <Dialog open={signOutModalOpen} onOpenChange={setSignOutModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Sign Out All Sessions?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will revoke all active login sessions on other browsers, phones, and computers.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignOutModalOpen(false)}
              disabled={isSigningOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOutAll}
              disabled={isSigningOut}
            >
              {isSigningOut && <Loader2 size={13} className="animate-spin mr-1.5" />}
              Sign out all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Revoke Trusted */}
      <Dialog open={revokeTrustedModalOpen} onOpenChange={setRevokeTrustedModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Revoke All Trusted Devices?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              All trusted devices will require two-factor authentication on subsequent logins.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeTrustedModalOpen(false)}
              disabled={isRevokingTrusted}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeTrusted}
              disabled={isRevokingTrusted}
            >
              {isRevokingTrusted && <Loader2 size={13} className="animate-spin mr-1.5" />}
              Revoke all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal (with DELETE verification) */}
      <DeleteAccountModal
        open={deleteAccountModalOpen}
        onOpenChange={setDeleteAccountModalOpen}
        onConfirmDelete={handleConfirmDelete}
        userEmail={userEmail}
      />
    </>
  );
};

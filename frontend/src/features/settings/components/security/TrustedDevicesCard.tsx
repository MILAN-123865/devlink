import React, { useState } from "react";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface TrustedDeviceItem {
  id: string;
  name: string;
  type: "desktop" | "mobile";
  details: string;
  addedDate: string;
}

export const TrustedDevicesCard: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmRemoveAllOpen, setConfirmRemoveAllOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const [devices, setDevices] = useState<TrustedDeviceItem[]>([
    {
      id: "trust-1",
      name: "Windows PC",
      type: "desktop",
      details: "Chrome on Windows 11",
      addedDate: "Aug 10, 2024",
    },
    {
      id: "trust-2",
      name: "Android Phone",
      type: "mobile",
      details: "Chrome on Android",
      addedDate: "Aug 12, 2024",
    },
  ]);

  const handleRemoveDevice = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setConfirmRemoveId(null);
    toast.success(`Removed trust for ${dev?.name || "device"}.`);
  };

  const handleRemoveAll = () => {
    setDevices([]);
    setConfirmRemoveAllOpen(false);
    toast.success("All trusted devices have been revoked.");
  };

  const getIcon = (type: TrustedDeviceItem["type"]) => {
    if (type === "mobile") return <Smartphone className="h-5 w-5 text-primary" />;
    return <Laptop className="h-5 w-5 text-primary" />;
  };

  return (
    <>
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-foreground">Trusted Devices</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Devices you trust and won&apos;t require 2FA on.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="text-xs font-medium border-border hover:bg-muted h-8"
          >
            View all
          </Button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {devices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No trusted devices registered.
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-surface p-3.5 transition-colors hover:bg-muted/10"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                    {getIcon(device.type)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{device.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{device.details}</p>
                    <p className="text-[11px] text-muted-foreground">Added {device.addedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-[10px] px-1.5 py-0 h-4">
                    Trusted
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setConfirmRemoveId(device.id)}
                        className="text-destructive text-xs cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Revoke trust
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Remove All Action */}
        {devices.length > 0 && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemoveAllOpen(true)}
              className="w-full text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/50 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove all trusted devices
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Revoking Single Device */}
      {confirmRemoveId && (
        <Dialog open={Boolean(confirmRemoveId)} onOpenChange={() => setConfirmRemoveId(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Revoke Device Trust?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This device will be prompted for full two-factor verification on next login.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-0 mt-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmRemoveId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => confirmRemoveId && handleRemoveDevice(confirmRemoveId)}
              >
                Revoke trust
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal for Revoking All */}
      <Dialog open={confirmRemoveAllOpen} onOpenChange={setConfirmRemoveAllOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Remove All Trusted Devices?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              All recognized devices will lose trusted status and will require two-factor
              authentication on subsequent logins.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setConfirmRemoveAllOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleRemoveAll}>
              Remove all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Trusted Devices</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Devices that do not require multi-factor verification challenges.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-border py-2 space-y-1">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between py-3 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                    {getIcon(device.type)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{device.name}</p>
                    <p className="text-[11px] text-muted-foreground">{device.details}</p>
                    <p className="text-[10px] text-muted-foreground">Added {device.addedDate}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRemoveId(device.id)}
                  className="text-xs font-medium text-destructive hover:bg-destructive/10 border-border h-7 px-2"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

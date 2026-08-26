import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DonationsApi } from "@/api/modules/donations";
import { useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

const PRESET_AMOUNTS = [5, 10, 25, 50];

export default function DonationModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
}: DonationModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const donationMutation = useMutation({
    mutationFn: DonationsApi.createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
  });

  const handleDonate = () => {
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    if (isNaN(finalAmount) || finalAmount < 1) return;

    donationMutation.mutate({
      recipient_id: recipientId,
      amount: finalAmount * 100, // Convert to cents
      message,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border p-6 text-foreground shadow-xl">
        <DialogHeader className="mb-2">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-pink-500" />
            <DialogTitle className="text-lg font-medium text-foreground">
              Support {recipientName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Your contribution helps developers continue creating amazing open source projects and content.
          </p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount("");
                }}
                className={`py-2 rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                  amount === preset && !customAmount
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Custom Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground sm:text-sm">$</span>
              </div>
              <input
                type="number"
                min="1"
                placeholder="Other amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(0);
                }}
                className="pl-7 block w-full rounded-md border border-border bg-surface text-foreground shadow-xs focus:border-primary focus:ring-1 focus:ring-primary text-sm p-2"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-1">
              Leave a Message (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Thank you for your hard work!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="block w-full rounded-md border border-border bg-surface text-foreground shadow-xs focus:border-primary focus:ring-1 focus:ring-primary text-sm p-2"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDonate}
            disabled={donationMutation.isPending || (!amount && !customAmount)}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            {donationMutation.isPending ? "Processing..." : "Proceed to Checkout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

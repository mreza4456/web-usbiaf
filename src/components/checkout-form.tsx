"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Lock } from "lucide-react";
import { createPayPalOrder, capturePayPalOrder } from "@/action/paypal";

interface CustomPayPalDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // `amount` is DISPLAY ONLY (shown to the buyer for reassurance). The
  // actual amount charged is recomputed server-side in createPayPalOrder
  // from cartIds + voucherId, so a manipulated `amount` here can't change
  // what's actually charged.
  amount: number;
  cartIds: string[];
  voucherId?: string;
  onPaymentSuccess: (result: { paypalOrderId: string; captureId: string | null }) => void;
}

function CustomPayPalDialog({
  open,
  setOpen,
  amount,
  cartIds,
  voucherId,
  onPaymentSuccess,
}: CustomPayPalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [email, setEmail] = useState("");
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardholderName || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setDetailsConfirmed(true);
  };

  // Called when the buyer clicks the PayPal button, before they're
  // redirected to approve the payment. Creates the order via the
  // createPayPalOrder server action (mirrors getStripeClientSecret) so the
  // amount is set server-side and can't be tampered with client-side.
  const createOrder = async () => {
    const result = await createPayPalOrder(cartIds, voucherId);

    if (!result.success || !result.data) {
      toast.error(result.message || "Could not start PayPal checkout");
      throw new Error(result.message || "Could not start PayPal checkout");
    }

    return result.data; // PayPal order id
  };

  // Called after the buyer approves the payment on PayPal's side.
  // Captures the order via the capturePayPalOrder server action to
  // actually take the funds. Both the PayPal order id AND the capture id
  // are passed up so the caller can verify the order server-side again in
  // processCheckout before persisting anything.
  const onApprove = async (data: { orderID: string }) => {
    setLoading(true);
    try {
      const result = await capturePayPalOrder(data.orderID);

      if (!result.success || !result.data) {
        throw new Error(result.message || "Payment could not be completed");
      }

      toast.success("Payment successful!");
      onPaymentSuccess({
        paypalOrderId: data.orderID,
        captureId: result.data.capture_id,
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const onError = (err: any) => {
    console.error("PayPal error:", err);
    toast.error("Payment failed. Please try again.");
    setLoading(false);
  };

  const onCancel = () => {
    toast.info("Payment cancelled");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Enter your details and pay securely with PayPal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount Display */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-2xl font-bold text-primary">
                ${amount.toLocaleString()}
              </span>
            </div>
          </div>

          {!detailsConfirmed ? (
            <form onSubmit={handleConfirmDetails} className="space-y-5">
              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cardholderName"
                  type="text"
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Your payment information is secure and encrypted
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Continue to PayPal
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 flex items-center justify-between">
                <span>
                  Paying as <span className="font-medium">{cardholderName}</span> ({email})
                </span>
                <button
                  type="button"
                  className="text-primary text-xs underline"
                  onClick={() => setDetailsConfirmed(false)}
                  disabled={loading}
                >
                  Edit
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing payment...
                </div>
              )}

              <div className={loading ? "pointer-events-none opacity-50" : ""}>
                <PayPalButtons
                  style={{ layout: "vertical", label: "pay" }}
                  disabled={loading}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  onCancel={onCancel}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CustomPayPalDialog;
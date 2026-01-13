import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePaymentProcessing } from "@/hooks/payments/usePaymentProcessing";
import { formatBHD } from "../utils/paymentCalculations";
import { CreditCard, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { formatIBAN } from "@/utils/ibanValidation";

interface PaymentProcessingDialogProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
  promoterId: string;
  promoterName: string;
  amount: number;
  ibanNumber?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  shiftTitle: string;
  onPaymentComplete: () => void;
}

export function PaymentProcessingDialog({
  open,
  onClose,
  assignmentId,
  promoterId,
  promoterName,
  amount,
  ibanNumber,
  bankName,
  bankAccountHolderName,
  shiftTitle,
  onPaymentComplete
}: PaymentProcessingDialogProps) {
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const { processPayment, processing } = usePaymentProcessing();
  const [step, setStep] = useState<'confirm' | 'complete'>('confirm');

  const handleProcessPayment = async () => {
    if (!transactionReference.trim()) {
      return;
    }

    try {
      await processPayment({
        assignmentId,
        amount,
        transactionReference: transactionReference.trim(),
        paymentDate,
        notes: notes.trim() || undefined
      });

      setStep('complete');
      
      // Reset form and close after delay
      setTimeout(() => {
        setStep('confirm');
        setTransactionReference("");
        setNotes("");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        onPaymentComplete();
        onClose();
      }, 2000);

    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleClose = () => {
    if (!processing) {
      setStep('confirm');
      setTransactionReference("");
      setNotes("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Record bank transfer payment for {promoterName}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Payment Amount</span>
                <span className="text-2xl font-bold">{formatBHD(amount)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Shift: {shiftTitle}
              </div>
            </div>

            {ibanNumber && (
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Bank Account Details:</div>
                  <div className="text-sm space-y-1">
                    {bankAccountHolderName && (
                      <div>Account Holder: <span className="font-medium">{bankAccountHolderName}</span></div>
                    )}
                    <div>IBAN: <span className="font-mono">{formatIBAN(ibanNumber)}</span></div>
                    {bankName && <div>Bank: {bankName}</div>}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!ibanNumber && (
              <Alert variant="destructive">
                <AlertDescription>
                  Warning: Promoter has not provided bank account details. Payment can still be processed, but receipt may be incomplete.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_reference">
                  Transaction Reference Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transaction_reference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Enter bank transaction reference"
                  required
                  disabled={processing}
                />
                <p className="text-xs text-muted-foreground">
                  Reference number from your bank transfer confirmation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={processing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this payment"
                  rows={3}
                  disabled={processing}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={processing}>
                Cancel
              </Button>
              <Button 
                onClick={handleProcessPayment} 
                disabled={!transactionReference.trim() || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Payment"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Processed Successfully!</h3>
            <p className="text-muted-foreground text-center">
              Receipt has been generated and sent to {promoterName}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type PaymentType = 'bonus' | 'overtime' | 'extra_task';

type AddExtraPaymentDialogProps = {
  shiftAssignmentId: string;
  promoterId: string;
  promoterName: string;
  shiftId: string;
  onSuccess?: () => void;
  compact?: boolean;
};

const paymentTypeLabels: Record<PaymentType, string> = {
  bonus: 'Bonus Payment',
  overtime: 'Overtime',
  extra_task: 'Extra Task/Job',
};

const paymentTypeDescriptions: Record<PaymentType, string> = {
  bonus: 'Additional reward for good performance',
  overtime: 'Payment for extra hours worked',
  extra_task: 'Payment for additional tasks (setup, supervision, etc.)',
};

export const AddExtraPaymentDialog = ({
  shiftAssignmentId,
  promoterId,
  promoterName,
  shiftId,
  onSuccess,
  compact = false,
}: AddExtraPaymentDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<PaymentType>('bonus');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('extra_payments')
        .insert({
          shift_assignment_id: shiftAssignmentId,
          promoter_id: promoterId,
          shift_id: shiftId,
          amount: parseFloat(amount),
          type,
          description: description.trim() || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success(`${paymentTypeLabels[type]} of BHD ${parseFloat(amount).toFixed(3)} added for ${promoterName}`);
      setOpen(false);
      setAmount('');
      setDescription('');
      setType('bonus');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding extra payment:', error);
      toast.error("Failed to add extra payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={compact ? "h-8 text-xs" : "flex-1"}>
          <Plus className={compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
          {compact ? "Extra" : "Extra Payment"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Extra Payment</DialogTitle>
          <DialogDescription>
            Add bonus, overtime, or extra task payment for {promoterName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as PaymentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(paymentTypeLabels) as PaymentType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex flex-col">
                      <span>{paymentTypeLabels[t]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {paymentTypeDescriptions[type]}
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (BHD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add a note about this payment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 font-medium">
                Will add BHD {parseFloat(amount).toFixed(3)} as {paymentTypeLabels[type].toLowerCase()}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? "Adding..." : "Add Extra Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


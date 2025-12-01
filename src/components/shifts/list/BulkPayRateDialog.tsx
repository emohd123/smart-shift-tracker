import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface BulkPayRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedShiftIds: string[];
  onSuccess?: () => void;
}

const BulkPayRateDialog = ({
  open,
  onOpenChange,
  selectedShiftIds,
  onSuccess,
}: BulkPayRateDialogProps) => {
  const [payRate, setPayRate] = useState("");
  const [payRateType, setPayRateType] = useState("hourly");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!payRate || parseFloat(payRate) < 0) {
      toast.error("Please enter a valid pay rate");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("shifts")
        .update({
          pay_rate: parseFloat(payRate),
          pay_rate_type: payRateType,
          updated_at: new Date().toISOString(),
        })
        .in("id", selectedShiftIds);

      if (error) throw error;

      toast.success("Pay rates updated successfully", {
        description: `Updated ${selectedShiftIds.length} shift${selectedShiftIds.length > 1 ? 's' : ''}`,
      });

      setPayRate("");
      setPayRateType("hourly");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating pay rates:", error);
      toast.error("Failed to update pay rates", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Pay Rates</DialogTitle>
          <DialogDescription>
            Set the pay rate for {selectedShiftIds.length} selected shift
            {selectedShiftIds.length > 1 ? "s" : ""}. This will override any existing pay rates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-pay-rate">Pay Rate</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="mr-2 text-muted-foreground">BHD</span>
                <Input
                  id="bulk-pay-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payRate}
                  onChange={(e) => setPayRate(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <Select value={payRateType} onValueChange={setPayRateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Per Hour</SelectItem>
                  <SelectItem value="daily">Per Day</SelectItem>
                  <SelectItem value="monthly">Per Month</SelectItem>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <DollarSign className="mr-2 h-4 w-4" />
              {isUpdating ? "Updating..." : "Update Pay Rates"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPayRateDialog;

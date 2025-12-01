import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type EditTimeLogDialogProps = {
  timeLogId: string;
  checkInTime: string;
  checkOutTime: string | null;
  payRate: number;
  payRateType: string;
  onUpdate: () => void;
};

export const EditTimeLogDialog = ({
  timeLogId,
  checkInTime,
  checkOutTime,
  payRate,
  payRateType,
  onUpdate,
}: EditTimeLogDialogProps) => {
  const [open, setOpen] = useState(false);
  const [checkInDate, setCheckInDate] = useState(format(new Date(checkInTime), "yyyy-MM-dd"));
  const [checkInTime24, setCheckInTime24] = useState(format(new Date(checkInTime), "HH:mm"));
  const [checkOutDate, setCheckOutDate] = useState(
    checkOutTime ? format(new Date(checkOutTime), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [checkOutTime24, setCheckOutTime24] = useState(
    checkOutTime ? format(new Date(checkOutTime), "HH:mm") : format(new Date(), "HH:mm")
  );

  const calculateEarnings = (hours: number): number => {
    switch (payRateType) {
      case 'hourly': return hours * payRate;
      case 'daily': return (hours / 8) * payRate;
      case 'monthly': return (hours / 160) * payRate;
      case 'fixed': return payRate;
      default: return hours * payRate;
    }
  };

  const calculatePreview = () => {
    const checkIn = new Date(`${checkInDate}T${checkInTime24}`);
    const checkOut = new Date(`${checkOutDate}T${checkOutTime24}`);
    
    if (checkOut <= checkIn) {
      return { hours: 0, earnings: 0, valid: false };
    }
    
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return { hours, earnings: calculateEarnings(hours), valid: true };
  };

  const preview = calculatePreview();

  const handleSave = async () => {
    if (!preview.valid) {
      toast.error("Check-out time must be after check-in time");
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const checkIn = new Date(`${checkInDate}T${checkInTime24}`);
      const checkOut = new Date(`${checkOutDate}T${checkOutTime24}`);

      const { error } = await supabase
        .from("time_logs")
        .update({
          check_in_time: checkIn.toISOString(),
          check_out_time: checkOut.toISOString(),
          total_hours: preview.hours,
          earnings: preview.earnings,
        })
        .eq("id", timeLogId);

      if (error) throw error;

      toast.success("Time log updated successfully");
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error updating time log:", error);
      toast.error("Failed to update time log");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
          <DialogDescription>
            Adjust the check-in and check-out times for this work session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Check-In Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
              <Input
                type="time"
                value={checkInTime24}
                onChange={(e) => setCheckInTime24(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Check-Out Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
              <Input
                type="time"
                value={checkOutTime24}
                onChange={(e) => setCheckOutTime24(e.target.value)}
              />
            </div>
          </div>

          {preview.valid && (
            <div className="p-3 bg-accent/50 rounded-md space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-medium">{preview.hours.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Earnings:</span>
                <span className="font-medium text-green-600">BHD {preview.earnings.toFixed(3)}</span>
              </div>
            </div>
          )}

          {!preview.valid && (
            <p className="text-sm text-destructive">Check-out must be after check-in</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!preview.valid}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

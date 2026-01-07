import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { format } from "date-fns";

type ManualCheckInDialogProps = {
  onCheckIn: (customTime?: Date) => void;
  loading: boolean;
  compact?: boolean;
};

export const ManualCheckInDialog = ({ onCheckIn, loading, compact = false }: ManualCheckInDialogProps) => {
  const [open, setOpen] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [checkInDate, setCheckInDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [checkInTime, setCheckInTime] = useState(format(new Date(), "HH:mm"));

  const handleQuickCheckIn = () => {
    onCheckIn();
    setOpen(false);
  };

  const handleManualCheckIn = () => {
    const customTime = new Date(`${checkInDate}T${checkInTime}`);
    onCheckIn(customTime);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={compact ? "h-8 text-xs" : "flex-1"}>
          <Clock className={compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
          {compact ? "Check In" : "Manual Check-In"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check In Options</DialogTitle>
          <DialogDescription>
            Choose to check in now or set a custom time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleQuickCheckIn}
            disabled={loading}
          >
            <Clock className="h-4 w-4 mr-2" />
            Check in now ({format(new Date(), "HH:mm")})
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Set Custom Check-In Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
              <Input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleManualCheckIn}
              disabled={loading}
            >
              Check In at Custom Time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

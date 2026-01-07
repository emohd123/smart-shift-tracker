import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import { format } from "date-fns";

type ManualCheckOutDialogProps = {
  onCheckOut: (customTime?: Date) => void;
  loading: boolean;
  checkInTime: string;
  compact?: boolean;
};

export const ManualCheckOutDialog = ({ onCheckOut, loading, checkInTime, compact = false }: ManualCheckOutDialogProps) => {
  const [open, setOpen] = useState(false);
  
  // Default checkout date to the same day as check-in
  const checkInDate = new Date(checkInTime);
  const [checkOutDate, setCheckOutDate] = useState(format(checkInDate, "yyyy-MM-dd"));
  const [checkOutTime, setCheckOutTime] = useState(format(new Date(), "HH:mm"));

  // Update date when dialog opens to use check-in date
  useEffect(() => {
    if (open) {
      setCheckOutDate(format(checkInDate, "yyyy-MM-dd"));
      setCheckOutTime(format(new Date(), "HH:mm"));
    }
  }, [open, checkInTime]);

  const handleQuickCheckOut = () => {
    onCheckOut();
    setOpen(false);
  };

  const handleManualCheckOut = () => {
    const customTime = new Date(`${checkOutDate}T${checkOutTime}`);
    onCheckOut(customTime);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className={compact ? "h-8 text-xs" : "flex-1"}>
          <LogOut className={compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
          Check Out
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Check Out Options</DialogTitle>
          <DialogDescription>
            Choose to check out now or set a custom time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Show check-in info */}
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <p className="text-muted-foreground">
              Checked in: <span className="font-medium text-foreground">{format(checkInDate, "MMM dd, yyyy HH:mm")}</span>
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleQuickCheckOut}
            disabled={loading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Check out now ({format(new Date(), "HH:mm")})
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
            <Label>Set Custom Check-Out Time</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={format(checkInDate, "yyyy-MM-dd")}
              />
              <Input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Check-out must be after check-in time
            </p>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleManualCheckOut}
              disabled={loading}
            >
              Check Out at Custom Time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


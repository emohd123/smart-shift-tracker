import { useState } from "react";
import { Edit, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

type EditAssignmentDialogProps = {
  assignmentId: string;
  promoterName: string;
  currentStartTime?: string;
  currentEndTime?: string;
  currentAutoCheckIn?: boolean;
  currentAutoCheckOut?: boolean;
  hasTimeLogs: boolean;
  onUpdate?: () => void;
  compact?: boolean;
};

export const EditAssignmentDialog = ({
  assignmentId,
  promoterName,
  currentStartTime = "09:00",
  currentEndTime = "17:00",
  currentAutoCheckIn = false,
  currentAutoCheckOut = false,
  hasTimeLogs,
  onUpdate,
  compact = false,
}: EditAssignmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState(currentStartTime);
  const [endTime, setEndTime] = useState(currentEndTime);
  const [autoCheckIn, setAutoCheckIn] = useState(currentAutoCheckIn);
  const [autoCheckOut, setAutoCheckOut] = useState(currentAutoCheckOut);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (startTime >= endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("shift_assignments")
        .update({
          scheduled_start_time: startTime,
          scheduled_end_time: endTime,
          auto_checkin_enabled: autoCheckIn,
          auto_checkout_enabled: autoCheckOut,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Assignment schedule updated successfully");
      setOpen(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={compact ? "h-8 text-xs" : ""}>
          <Edit className={compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
          {compact ? "Schedule" : "Edit Schedule"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Work Schedule</DialogTitle>
          <DialogDescription>
            Update work hours for {promoterName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasTimeLogs && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This promoter has attendance records. You can still update their schedule for future shifts.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto Check-in</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically check in at scheduled start time
                </p>
              </div>
              <Switch
                checked={autoCheckIn}
                onCheckedChange={setAutoCheckIn}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto Check-out</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically check out at scheduled end time
                </p>
              </div>
              <Switch
                checked={autoCheckOut}
                onCheckedChange={setAutoCheckOut}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

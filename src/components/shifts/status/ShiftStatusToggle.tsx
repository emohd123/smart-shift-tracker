
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShiftStatus } from "@/types/database";
import { calculateShiftStatus, getStatusLabel } from "../utils/statusCalculations";
import { Shift } from "../types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Settings } from "lucide-react";

type ShiftStatusToggleProps = {
  shift: Shift;
  onUpdate: () => void;
};

export const ShiftStatusToggle = ({ shift, onUpdate }: ShiftStatusToggleProps) => {
  const [updating, setUpdating] = useState(false);
  const isManualOverride = shift.manual_status_override || false;
  const autoStatus = calculateShiftStatus(shift);
  const displayStatus = isManualOverride && shift.override_status 
    ? shift.override_status 
    : autoStatus;

  const handleToggleChange = async (checked: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("shifts")
        .update({
          manual_status_override: checked,
          override_status: checked ? displayStatus : null,
        })
        .eq("id", shift.id);

      if (error) throw error;

      toast.success(checked ? "Manual control enabled" : "Auto status enabled");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating status mode:", error);
      toast.error("Failed to update status mode");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("shifts")
        .update({ override_status: newStatus })
        .eq("id", shift.id);

      if (error) throw error;

      toast.success("Status updated successfully");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Shift Status Control
        </CardTitle>
        <CardDescription>
          Manage shift status automatically or manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="manual-mode">Manual Status Control</Label>
            <p className="text-sm text-muted-foreground">
              {isManualOverride
                ? "Status is set manually"
                : "Status updates automatically based on dates"}
            </p>
          </div>
          <Switch
            id="manual-mode"
            checked={isManualOverride}
            onCheckedChange={handleToggleChange}
            disabled={updating}
          />
        </div>

        {!isManualOverride && (
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Automatic Status:</span>
              <Badge variant="outline">{getStatusLabel(autoStatus)}</Badge>
            </div>
          </div>
        )}

        {isManualOverride && (
          <div className="space-y-2">
            <Label>Override Status</Label>
            <Select
              value={shift.override_status || displayStatus}
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ShiftStatus.Upcoming}>Upcoming</SelectItem>
                <SelectItem value={ShiftStatus.Ongoing}>Ongoing</SelectItem>
                <SelectItem value={ShiftStatus.Completed}>Completed</SelectItem>
                <SelectItem value={ShiftStatus.Cancelled}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

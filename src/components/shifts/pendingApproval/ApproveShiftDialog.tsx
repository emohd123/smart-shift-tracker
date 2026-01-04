import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type ApproveShiftDialogProps = {
  assignmentId: string;
  shiftTitle: string;
  companyName?: string;
  onSuccess?: () => void;
};

export const ApproveShiftDialog = ({
  assignmentId,
  shiftTitle,
  companyName = "Unknown Company",
  onSuccess,
}: ApproveShiftDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("shift_assignments")
        .update({ status: "accepted" })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Shift approved! You can now check in.");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error approving shift:", error);
      toast.error("Failed to approve shift");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("shift_assignments")
        .update({ status: "rejected" })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success("Shift rejected");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error rejecting shift:", error);
      toast.error("Failed to reject shift");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <CheckCircle className="mr-2 h-4 w-4" />
          Review & Approve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Shift Assignment</DialogTitle>
          <DialogDescription>
            Confirm you want to work on this shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {shiftTitle}
            </h3>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Assigned by {companyName}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 dark:text-amber-100">
              By approving this shift, you confirm your availability and agree to the company's contract terms.
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• You will be able to check in at the scheduled time</p>
            <p>• Your work hours and earnings will be tracked automatically</p>
            <p>• You can view and manage this shift in your dashboard</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Decline
          </Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

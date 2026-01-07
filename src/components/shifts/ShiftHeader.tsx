
import { Badge } from "@/components/ui/badge";
import { Shift } from "./types/ShiftTypes";
import { Button } from "@/components/ui/button";
import { Edit, Trash, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBadge } from "./utils/shiftUtils";
import { getEffectiveStatus } from "./utils/statusCalculations";
import {
  CardTitle,
  CardDescription,
  CardHeader
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { canDeleteShift, ShiftDeleteCheckResult } from "@/hooks/shifts/utils/delete/deletePermissionUtils";

type ShiftHeaderProps = {
  shift: Shift;
  isAdmin: boolean;
  isCompany?: boolean;
  onDelete: (id: string) => void;
};

export function ShiftHeader({ shift, isAdmin, isCompany, onDelete }: ShiftHeaderProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<ShiftDeleteCheckResult | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);
  const effectiveStatus = getEffectiveStatus(shift);
  const statusBadge = getStatusBadge(effectiveStatus);

  // Check if shift can be deleted when dialog opens
  const checkShiftDeletion = async () => {
    setCheckingDelete(true);
    try {
      const result = await canDeleteShift(shift.id);
      setDeleteCheck(result);
    } catch (error) {
      console.error("Error checking delete eligibility:", error);
      setDeleteCheck({
        canDelete: false,
        reason: "Failed to check deletion eligibility",
        hasAssignments: false,
        hasCompletedWork: false,
        assignmentCount: 0,
        completedWorkCount: 0
      });
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCheck?.canDelete) return;
    
    setIsDeleting(true);

    try {
      // Call the deletion function
      await onDelete(shift.id);
    } catch (error) {
      console.error("Error during deletion:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Can delete if admin or company
  const canShowDelete = isAdmin || isCompany;

  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <CardTitle className="text-2xl">{shift.title}</CardTitle>
          <CardDescription className="mt-1">
            <Badge className={cn("capitalize flex w-fit items-center", statusBadge.color)}>
              {statusBadge.icon}
              {effectiveStatus}
            </Badge>
          </CardDescription>
        </div>

        {canShowDelete && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit size={14} className="mr-2" />
              Edit
            </Button>

            <AlertDialog onOpenChange={(open) => open && checkShiftDeletion()}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash size={14} className="mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {checkingDelete ? 'Checking...' : deleteCheck?.canDelete ? 'Delete Shift?' : 'Cannot Delete Shift'}
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      {checkingDelete ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Checking if shift can be deleted...</span>
                        </div>
                      ) : deleteCheck?.canDelete ? (
                        <>
                          <p>
                            This will permanently delete the shift "{shift.title}".
                            This action cannot be undone.
                          </p>
                          {deleteCheck.hasAssignments && (
                            <p className="text-amber-600 dark:text-amber-400 text-sm">
                              Note: {deleteCheck.assignmentCount} promoter assignment{deleteCheck.assignmentCount > 1 ? 's' : ''} will also be removed.
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-start gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">This shift cannot be deleted.</p>
                            <p className="text-sm mt-1">{deleteCheck?.reason}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Work history must be preserved. You can mark the shift as cancelled instead.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {deleteCheck?.canDelete && !checkingDelete && (
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </CardHeader>
  );
}

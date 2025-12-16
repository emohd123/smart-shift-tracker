
import { Badge } from "@/components/ui/badge";
import { Shift } from "./types/ShiftTypes";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
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
import { useState } from "react";

type ShiftHeaderProps = {
  shift: Shift;
  isAdmin: boolean;
  onDelete: (id: string) => void;
};

export function ShiftHeader({ shift, isAdmin, onDelete }: ShiftHeaderProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const effectiveStatus = getEffectiveStatus(shift);
  const statusBadge = getStatusBadge(effectiveStatus);

  const handleDelete = async () => {
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

        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit size={14} className="mr-2" />
              Edit
            </Button>

            <AlertDialog>
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
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the shift "{shift.title}".
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </CardHeader>
  );
}

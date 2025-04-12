
import { Badge } from "@/components/ui/badge";
import { Shift } from "./types/ShiftTypes"; // Update import path
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBadge } from "./utils/shiftUtils";
import { 
  CardTitle, 
  CardDescription, 
  CardHeader 
} from "@/components/ui/card";

type ShiftHeaderProps = {
  shift: Shift;
  isAdmin: boolean;
  onDelete: (id: string) => void;
};

export function ShiftHeader({ shift, isAdmin, onDelete }: ShiftHeaderProps) {
  const statusBadge = getStatusBadge(shift.status);
  
  const handleDelete = () => {
    console.log("ShiftHeader - handleDelete called for shift:", shift.id);
    onDelete(shift.id);
  };
  
  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <CardTitle className="text-2xl">{shift.title}</CardTitle>
          <CardDescription className="mt-1">
            <Badge className={cn("capitalize flex w-fit items-center", statusBadge.color)}>
              {statusBadge.icon}
              {shift.status}
            </Badge>
          </CardDescription>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit size={14} className="mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash size={14} className="mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
  );
}

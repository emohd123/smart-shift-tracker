
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2 } from "lucide-react";
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

interface DataPurgeButtonProps {
  entity: "shifts" | "promoters" | "all";
  onPurge: () => Promise<void>;
  isDeleting?: boolean;
  variant?: "outline" | "destructive" | "secondary";
  size?: "sm" | "default" | "lg";
}

export const DataPurgeButton = ({ 
  entity, 
  onPurge, 
  isDeleting = false,
  variant = "destructive",
  size = "default"
}: DataPurgeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePurge = async () => {
    await onPurge();
    setIsOpen(false);
  };
  
  const getEntityLabel = () => {
    switch (entity) {
      case "shifts":
        return "shifts";
      case "promoters":
        return "promoters";
      case "all":
        return "data (shifts and promoters)";
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          disabled={isDeleting}
        >
          {entity === "all" ? <Eraser className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
          {isDeleting 
            ? `Deleting...`
            : entity === "all" 
              ? `Purge All Data`
              : `Delete All ${getEntityLabel()}`
          }
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Confirm Data Deletion
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete ALL {getEntityLabel()}. This action cannot be undone.
            All records will be permanently removed from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handlePurge}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

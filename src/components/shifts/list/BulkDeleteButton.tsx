
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BulkDeleteButtonProps {
  selectedCount: number;
  isDeleting: boolean;
  onBulkDelete: () => void;
}

const BulkDeleteButton = ({ 
  selectedCount, 
  isDeleting, 
  onBulkDelete 
}: BulkDeleteButtonProps) => {
  if (selectedCount === 0) return null;
  
  return (
    <Button 
      variant="destructive" 
      onClick={onBulkDelete}
      disabled={isDeleting}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete ({selectedCount})
    </Button>
  );
};

export default BulkDeleteButton;

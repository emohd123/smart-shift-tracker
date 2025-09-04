
import { useState } from "react";
import { toast } from "sonner";
import { deletePromoterFromDatabase, deleteAllPromotersFromDatabase } from "./utils/deleteUtils";

interface UsePromoterDeleteProps {
  refreshPromoters?: () => void;
}

export const usePromoterDelete = ({ refreshPromoters }: UsePromoterDeleteProps = {}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePromoter = async (id: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deletePromoterFromDatabase(id);
      
      if (!success) {
        toast.error("Failed to Delete Promoter", {
          description: "Error removing the promoter from the database"
        });
        return;
      }
      
      toast.success("Promoter Deleted", {
        description: "The promoter has been permanently deleted"
      });
      
      if (refreshPromoters) {
        refreshPromoters();
      }
    } catch (err) {
      console.error('Deletion error:', err);
      toast.error("Deletion Failed", {
        description: "Unable to delete the promoter"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAllPromoters = async () => {
    if (isDeleting) {
      toast.info("Deletion in Progress", {
        description: "Please wait for the current operation to complete"
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      toast.info("Deleting All Promoters", {
        description: "This may take a moment..."
      });

      const success = await deleteAllPromotersFromDatabase();
      
      if (!success) {
        toast.error("Deletion Error", {
          description: "Some promoters couldn't be removed completely."
        });
      } else {
        toast.success("All Promoters Deleted", {
          description: "All promoters have been permanently removed"
        });
      }
      
      if (refreshPromoters) {
        refreshPromoters();
      }
    } catch (err) {
      console.error('Bulk deletion error:', err);
      toast.error("Deletion Failed", {
        description: "Unable to delete all promoters. Please try again later."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deletePromoter,
    deleteAllPromoters,
    isDeleting
  };
};

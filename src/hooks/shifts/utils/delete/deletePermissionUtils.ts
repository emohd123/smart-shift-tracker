
import { toast } from "sonner";

/**
 * Validates if the user has permission to delete shifts
 * @param userRole The role of the current user
 * @returns Boolean indicating if the user has permission
 */
export const validateDeletePermission = (userRole?: string): boolean => {
  if (userRole !== 'admin') {
    console.error('Permission denied: Only admin users can perform deletion');
    toast.error("Permission Denied", {
      description: "Only admin users can delete shifts"
    });
    return false;
  }
  
  return true;
};

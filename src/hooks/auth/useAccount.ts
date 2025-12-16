
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAccount = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const deactivateAccount = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      // Update user metadata to mark as deactivated
      const { error } = await supabase.auth.updateUser({
        data: { deactivated: true }
      });

      if (error) {
        throw error;
      }

      // Sign out the user after deactivation
      await supabase.auth.signOut();

      toast.success("Account deactivated successfully");

      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      console.error("Account deactivation error:", error);
      setAuthError(error.message || "Failed to deactivate account");
      toast.error(error.message || "Failed to deactivate account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.id) {
        throw new Error("Unable to determine user ID");
      }

      const userId = user.id;
      toast.info("Deleting account and all associated data...");

      // First, delete ALL time logs for this user using our custom RPC function


      // Use the RPC function we created with the correct parameter name
      const { error: rpcError } = await supabase.rpc('delete_user_time_logs', {
        target_user_id: userId
      });

      if (rpcError) {
        console.error("RPC delete time logs error:", rpcError);

        // Fallback to direct deletion if RPC fails

        const { error: directDeleteError } = await supabase
          .from('time_logs')
          .delete()
          .eq('user_id', userId);

        if (directDeleteError) {
          console.error("Direct deletion of time logs failed:", directDeleteError);
          throw new Error(`Failed to delete time logs: ${directDeleteError.message}`);
        }
      }

      // Verify time logs are deleted before proceeding
      const { data: remainingLogs, error: checkError } = await supabase
        .from('time_logs')
        .select('id')
        .eq('user_id', userId);

      if (checkError) {
        console.error("Error checking remaining logs:", checkError);
      } else if (remainingLogs && remainingLogs.length > 0) {
        console.warn(`${remainingLogs.length} time logs still remain for user ${userId}`);
        throw new Error("Could not delete all time logs - account deletion aborted");
      } else {

      }

      // Now call the delete_user RPC function

      const { error } = await supabase.rpc('delete_user', { target_user_id: userId });

      if (error) {
        throw error;
      }

      toast.success("Account deleted successfully");

      // Sign out the user after deletion
      await supabase.auth.signOut();

      // Redirect to home page with a longer delay to ensure sign out completes
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      console.error("Account deletion error:", error);
      setAuthError(error.message || "Failed to delete account");
      toast.error(error.message || "Failed to delete account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      setAuthError(error.message || "Failed to send password reset email");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Update password error:", error);
      setAuthError(error.message || "Failed to update password");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    deactivateAccount,
    deleteAccount,
    resetPassword,
    updatePassword,
    loading,
    authError,
  };
};

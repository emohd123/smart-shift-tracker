
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
      // Call the delete_user RPC function
      const { error } = await supabase.rpc('delete_user', {});
      
      if (error) {
        throw error;
      }
      
      toast.success("Account deleted successfully");
      
      // Sign out the user after deletion
      await supabase.auth.signOut();
      
      // Redirect to home page with a small delay to ensure sign out completes
      setTimeout(() => {
        window.location.href = "/";
      }, 300);
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

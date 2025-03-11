
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data && data.verification_status) {
        data.verification_status = data.verification_status as "pending" | "approved" | "rejected";
      }
      
      return data;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  const updateProfile = async (profile: { name?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      setError(error.message || "Failed to update profile");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    getUserProfile,
    updateProfile,
    loading,
    error,
  };
};


import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/context/AuthContext";
import { ProfileUpdate } from "@/hooks/useAuthHooks";

export const useProfile = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUserProfile = async (userId: string) => {
    try {

      setLoading(true);

      // Query the profiles table instead of auth.users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setError(error.message);
        toast.error("Failed to load profile data: " + error.message);
        throw error;
      }

      if (data) {

        return data as UserProfile;
      }


      toast.error("No profile data found. Please contact support.");
      return null;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setError(error.message);
      toast.error("Failed to load profile data: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userId: string, profileData: ProfileUpdate): Promise<void> => {
    setLoading(true);
    setError(null);
    try {


      // Update the profiles table
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (error) {
        console.error("Update profile error:", error);
        setError(error.message);
        toast.error("Failed to update profile: " + error.message);
        throw error;
      }

      // Also update auth user metadata if name is provided
      if (profileData.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: profileData.full_name,
          },
        });

        if (authError) {
          console.error("Update auth user metadata error:", authError);
          // Don't throw here, as the profile update was successful
        }
      }

      toast.success("Profile updated successfully");
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

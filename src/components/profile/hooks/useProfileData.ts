
import { useState, useEffect } from "react";
import { UserProfile, User } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProfileData(user: User | null) {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(null);
  const [currentIdCardUrl, setCurrentIdCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          console.log("Fetching profile for user ID:", user.id);
          
          // Direct Supabase query to get profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error loading profile:", error);
            setError(error.message);
            toast.error("Failed to load profile");
            return;
          }
          
          console.log("Profile data retrieved:", data);
          
          if (data) {
            // Ensure the verification_status has the correct type
            const typedProfile = {
              ...data,
              verification_status: data.verification_status as "pending" | "approved" | "rejected"
            } as UserProfile;
            
            setProfileData(typedProfile);
            
            // Set photo URLs if they exist
            if (typedProfile.profile_photo_url) {
              const profilePhotoUrl = await getPublicUrl('profile_photos', typedProfile.profile_photo_url);
              setCurrentProfilePhotoUrl(profilePhotoUrl);
            }
            
            if (typedProfile.id_card_url) {
              const idCardUrl = await getPublicUrl('id_cards', typedProfile.id_card_url);
              setCurrentIdCardUrl(idCardUrl);
            }
          } else {
            console.log("No profile data found for user");
          }
        } catch (error: any) {
          console.error("Error loading profile:", error);
          setError(error.message);
          toast.error("Failed to load profile");
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [user]);

  // Helper function to get public URL for storage items
  const getPublicUrl = async (bucketName: string, filePath: string) => {
    try {
      const { data } = await supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error(`Error getting public URL for ${bucketName}/${filePath}:`, error);
      return null;
    }
  };

  return {
    profileData,
    setProfileData,
    currentProfilePhotoUrl,
    setCurrentProfilePhotoUrl,
    currentIdCardUrl,
    setCurrentIdCardUrl,
    loading,
    error
  };
}

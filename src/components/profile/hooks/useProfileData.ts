
import { useState, useEffect } from "react";
import { UserProfile, User } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/auth/useProfile";

export function useProfileData(user: User | null) {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(null);
  const [currentIdCardUrl, setCurrentIdCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getUserProfile } = useProfile();

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          console.log("Fetching profile for user ID:", user.id);
          
          // Use the getUserProfile function from useProfile hook
          const data = await getUserProfile(user.id);
          
          if (data) {
            setProfileData(data);
            
            // Set photo URLs if they exist
            if (data.profile_photo_url) {
              const profilePhotoUrl = await getPublicUrl('profile_photos', data.profile_photo_url);
              setCurrentProfilePhotoUrl(profilePhotoUrl);
            }
            
            if (data.id_card_url) {
              const idCardUrl = await getPublicUrl('id_cards', data.id_card_url);
              setCurrentIdCardUrl(idCardUrl);
            }
          } else {
            console.log("No profile data found for user");
            toast.error("No profile data found. Please contact support.");
          }
        } catch (error: any) {
          console.error("Error loading profile:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [user, getUserProfile]);

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

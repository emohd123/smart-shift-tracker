
import { useState, useEffect } from "react";
import { UserProfile, User } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProfileData(user: User | null) {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(null);
  const [currentIdCardUrl, setCurrentIdCardUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          // Direct Supabase query to get profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error loading profile:", error);
            toast.error("Failed to load profile");
            return;
          }
          
          if (data) {
            // Ensure the verification_status has the correct type
            const typedProfile = {
              ...data,
              verification_status: data.verification_status as "pending" | "approved" | "rejected"
            } as UserProfile;
            
            setProfileData(typedProfile);
            setCurrentProfilePhotoUrl(typedProfile.profile_photo_url || null);
            setCurrentIdCardUrl(typedProfile.id_card_url || null);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          toast.error("Failed to load profile");
        }
      }
    };
    
    loadProfile();
  }, [user]);

  return {
    profileData,
    setProfileData,
    currentProfilePhotoUrl,
    setCurrentProfilePhotoUrl,
    currentIdCardUrl,
    setCurrentIdCardUrl
  };
}

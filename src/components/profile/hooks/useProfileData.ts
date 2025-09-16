
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
          
          // Get profile data from profiles table directly instead of auth.users
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error loading profile:", error);
            setError(error.message);
            return;
          }
          
          if (data) {
            setProfileData(data as UserProfile);
            
            // Set photo URLs if they exist
            if (data.profile_photo_url) {
              try {
                const profilePhotoUrl = await getPublicUrl('profile_photos', data.profile_photo_url);
                setCurrentProfilePhotoUrl(profilePhotoUrl);
              } catch (err) {
                console.error("Error getting profile photo URL:", err);
              }
            }
            
            if (data.id_card_url) {
              try {
                const idCardUrl = await getPublicUrl('id_cards', data.id_card_url);
                setCurrentIdCardUrl(idCardUrl);
              } catch (err) {
                console.error("Error getting ID card URL:", err);
              }
            }
          } else {
            console.log("No profile data found for user");
            setError("No profile data found. Please contact support.");
          }
        } catch (error: unknown) {
          console.error("Error loading profile:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          setError(errorMessage);
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
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error(`Error listing buckets: ${bucketsError.message}`);
        return null;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      // Create bucket if it doesn't exist
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createBucketError) {
          console.error(`Error creating bucket: ${createBucketError.message}`);
          return null;
        }
      }
      
      // Get public URL - getPublicUrl doesn't return error property
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error: unknown) {
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

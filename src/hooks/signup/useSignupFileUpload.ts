
import { supabase } from "@/integrations/supabase/client";
import { GenderType } from "@/types/database";
import { 
  createBucketIfNotExists, 
  uploadFileToBucket,
  getPublicUrl
} from "@/integrations/supabase/storage";

export const useSignupFileUpload = (setUploadingFiles: React.Dispatch<React.SetStateAction<boolean>>) => {
  const uploadFiles = async (userId: string, fileData: any) => {
    let idCardUrl = null;
    let profilePhotoUrl = null;
    const errors: string[] = [];

    try {
      setUploadingFiles(true);
      
      // Upload ID card with error handling
      if (fileData.idCard) {
        const fileExt = fileData.idCard.name.split('.').pop();
        const fileName = `${userId}/id_card_${Date.now()}.${fileExt}`;
        
        try {
          const uploadResult = await uploadFileToBucket(
            fileData.idCard,
            'id_cards',
            fileName
          );
            
          if (uploadResult.success && uploadResult.data) {
            idCardUrl = uploadResult.data;
            console.log("✓ ID card uploaded successfully");
          } else {
            errors.push(`ID card: ${uploadResult.error?.message || 'Upload failed'}`);
            console.error("ID card upload error:", uploadResult.error);
          }
        } catch (err) {
          errors.push(`ID card: ${err instanceof Error ? err.message : 'Unknown error'}`);
          console.error("ID card upload exception:", err);
        }
      }
      
      // Upload profile photo with error handling
      if (fileData.profilePhoto) {
        const fileExt = fileData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo_${Date.now()}.${fileExt}`;
        
        try {
          const uploadResult = await uploadFileToBucket(
            fileData.profilePhoto,
            'profile_photos',
            fileName
          );
            
          if (uploadResult.success && uploadResult.data) {
            profilePhotoUrl = uploadResult.data;
            console.log("✓ Profile photo uploaded successfully");
          } else {
            errors.push(`Profile photo: ${uploadResult.error?.message || 'Upload failed'}`);
            console.error("Profile photo upload error:", uploadResult.error);
          }
        } catch (err) {
          errors.push(`Profile photo: ${err instanceof Error ? err.message : 'Unknown error'}`);
          console.error("Profile photo upload exception:", err);
        }
      }
      
      return { idCardUrl, profilePhotoUrl, errors };
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateUserProfile = async (userId: string, formData: any, idCardUrl: string | null, profilePhotoUrl: string | null) => {
    try {
      console.log("Updating profile for user ID:", userId);
      
      const profileData = {
        full_name: formData.fullName || 'New User',
        nationality: formData.nationality || '',
        age: formData.age || '18',
        phone_number: formData.phoneNumber?.trim() || null,
        gender: formData.gender || 'Male',
        height: formData.height || '170',
        weight: formData.weight || '70',
        is_student: formData.isStudent === true,
        address: formData.address || '',
        bank_details: formData.bankDetails || null,
        id_card_url: idCardUrl,
        profile_photo_url: profilePhotoUrl,
        verification_status: 'pending',
        updated_at: new Date().toISOString(),
      };
      
      console.log("Profile data to save:", profileData);

      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select();
        
      if (error) {
        console.error("Error updating profile:", error);
        throw new Error(`Profile update failed: ${error.message}`);
      }
      
      console.log("✓ Profile updated successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Exception updating profile:", error);
      throw error;
    }
  };

  return { uploadFiles, updateUserProfile };
};

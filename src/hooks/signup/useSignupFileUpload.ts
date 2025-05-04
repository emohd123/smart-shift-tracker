
import { supabase } from "@/integrations/supabase/client";
import { GenderType } from "@/types/database";
import { 
  createBucketIfNotExists, 
  uploadFileToBucket,
  getPublicUrl
} from "@/integrations/supabase/storage";

export const useSignupFileUpload = (setUploadingFiles: React.Dispatch<React.SetStateAction<boolean>>) => {
  const uploadFiles = async (userId: string, fileData: any) => {
    try {
      setUploadingFiles(true);
      let idCardUrl = null;
      let profilePhotoUrl = null;
      
      // Create storage buckets if they don't exist using our utility function
      await createBucketIfNotExists('id_cards', { public: true });
      await createBucketIfNotExists('profile_photos', { public: true });
      
      // Upload ID card if provided
      if (fileData.idCard) {
        const fileExt = fileData.idCard.name.split('.').pop();
        const fileName = `${userId}/id_card.${fileExt}`;
        
        const uploadResult = await uploadFileToBucket(
          fileData.idCard,
          'id_cards',
          fileName
        );
          
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ID card: ${uploadResult.error?.message}`);
        }
        
        idCardUrl = uploadResult.data || fileName;
      }
      
      // Upload profile photo if provided
      if (fileData.profilePhoto) {
        const fileExt = fileData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo.${fileExt}`;
        
        const uploadResult = await uploadFileToBucket(
          fileData.profilePhoto,
          'profile_photos',
          fileName
        );
          
        if (!uploadResult.success) {
          throw new Error(`Failed to upload profile photo: ${uploadResult.error?.message}`);
        }
        
        profilePhotoUrl = uploadResult.data || fileName;
      }
      
      return { idCardUrl, profilePhotoUrl };
    } catch (error: any) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateUserProfile = async (userId: string, formData: any, idCardUrl: string, profilePhotoUrl: string) => {
    try {
      console.log("Updating profile for user ID:", userId);
      
      // Always ensure phone number is null if empty
      const phoneNumber = formData.phoneNumber?.trim() ? formData.phoneNumber.trim() : null;
      
      // Ensure all form data is properly formatted for database storage
      const profileData = {
        full_name: formData.fullName || 'New User',
        nationality: formData.nationality || '',
        age: parseInt(formData.age) || 18,
        phone_number: phoneNumber, // Explicitly set to null if empty
        gender: formData.gender as GenderType || GenderType.Male,
        height: parseInt(formData.height) || 170,
        weight: parseInt(formData.weight) || 70,
        is_student: formData.isStudent === true,
        address: formData.address || '',
        bank_details: formData.bankDetails || null,
        id_card_url: idCardUrl || null,
        profile_photo_url: profilePhotoUrl || null,
        verification_status: 'pending',
        role: 'promoter'
      };
      
      console.log("Profile data to save:", profileData);

      // Instead of trying to upsert, just update the profile
      // The trigger we created will have already made a profile on signup
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select();
        
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return { uploadFiles, updateUserProfile };
};

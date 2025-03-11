
import { supabase } from "@/integrations/supabase/client";

export const useSignupFileUpload = (setUploadingFiles: React.Dispatch<React.SetStateAction<boolean>>) => {
  const uploadFiles = async (userId: string, fileData: any) => {
    try {
      setUploadingFiles(true);
      let idCardUrl = null;
      let profilePhotoUrl = null;
      
      const { data: buckets } = await supabase.storage.listBuckets();
      
      if (!buckets?.find(b => b.name === 'id_cards')) {
        await supabase.storage.createBucket('id_cards', {
          public: true
        });
      }
      
      if (!buckets?.find(b => b.name === 'profile_photos')) {
        await supabase.storage.createBucket('profile_photos', {
          public: true
        });
      }
      
      if (fileData.idCard) {
        const fileExt = fileData.idCard.name.split('.').pop();
        const fileName = `${userId}/id_card.${fileExt}`;
        
        const { data: idCardData, error: idCardError } = await supabase.storage
          .from('id_cards')
          .upload(fileName, fileData.idCard);
          
        if (idCardError) throw idCardError;
        idCardUrl = `${fileName}`;
      }
      
      if (fileData.profilePhoto) {
        const fileExt = fileData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo.${fileExt}`;
        
        const { data: profilePhotoData, error: profilePhotoError } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, fileData.profilePhoto);
          
        if (profilePhotoError) throw profilePhotoError;
        profilePhotoUrl = `${fileName}`;
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
      // First check if a profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;

      const profileData = {
        full_name: formData.fullName,
        nationality: formData.nationality,
        age: parseInt(formData.age),
        phone_number: formData.phoneNumber,
        gender: formData.gender as any,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        is_student: formData.isStudent,
        address: formData.address,
        bank_details: formData.bankDetails || null,
        id_card_url: idCardUrl,
        profile_photo_url: profilePhotoUrl,
        verification_status: 'pending',
        role: 'promoter'  // Explicitly set role to promoter
      };
        
      // If profile exists, update it
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);
          
        if (error) throw error;
      } else {
        // If profile doesn't exist, insert a new one
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            ...profileData
          });
          
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return { uploadFiles, updateUserProfile };
};

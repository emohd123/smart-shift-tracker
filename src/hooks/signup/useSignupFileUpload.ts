
import { supabase } from "@/integrations/supabase/client";
import { GenderType } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";
import { 
  createBucketIfNotExists, 
  uploadFileToBucket,
  getPublicUrl
} from "@/integrations/supabase/storage";

interface SignupFileData {
  idCard?: File;
  profilePhoto?: File;
}

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export const useSignupFileUpload = (setUploadingFiles: React.Dispatch<React.SetStateAction<boolean>>) => {
  const uploadFiles = async (userId: string, fileData: SignupFileData) => {
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
    } catch (error: unknown) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

interface SignupFormData {
  fullName?: string;
  nationality?: string;
  age?: string;
  phoneNumber?: string;
  gender?: GenderType;
  height?: string;
  weight?: string;
  isStudent?: boolean;
  address?: string;
  bankDetails?: string;
  role?: string;
}

  const updateUserProfile = async (userId: string, formData: SignupFormData, idCardUrl: string | null, profilePhotoUrl: string | null) => {
    try {
      console.log("Creating/updating profile for user ID:", userId);

      // Work with the current table structure: id, tenant_id, full_name, email, role, verification_status, created_at, updated_at
      // For now, we'll store additional data in user metadata and create basic profile
      
      // Get user email for profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        throw userError;
      }

      // Create basic profile with current table structure
      const profileData = {
        id: userId,
        tenant_id: null, // Set to null to avoid foreign key issues
        full_name: formData.fullName || 'New User',
        email: user?.email || 'unknown@example.com',
        role: (formData.role || 'part_timer'),
        verification_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log("Basic profile data to save:", profileData);

      // Use upsert to create or update the profile (bypass type checking as schema is out of sync)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('profiles') as any).upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      }).select();
        
      if (error) {
        console.error("Error upserting profile:", error);
        throw error;
      }
      
      console.log("Profile created/updated successfully:", data);

      // Get the unique code from the created profile
      let uniqueCode = null;
      if (data && data[0]) {
        uniqueCode = data[0].unique_code;
      }
      
      // Store additional form data in user metadata for later use
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          nationality: formData.nationality || '',
          age: formData.age || '25',
          phone_number: formData.phoneNumber || null,
          gender: formData.gender || 'Male',
          height: formData.height || '0',
          weight: formData.weight || '0',
          is_student: formData.isStudent || false,
          address: formData.address || '',
          bank_details: formData.bankDetails || null,
          id_card_url: idCardUrl || null,
          profile_photo_url: profilePhotoUrl || null,
          unique_code: uniqueCode || 'USR' + userId.slice(-5).toUpperCase(),
          role: formData.role || 'part_timer'
        }
      });

      if (metadataError) {
        console.warn("Warning: Could not save additional metadata:", metadataError.message);
        // Don't fail the entire process for metadata
      } else {
        console.log("Additional user metadata saved successfully");
      }
      
      return data;
    } catch (error: unknown) {
      console.error("Error creating/updating profile:", error);
      throw error;
    }
  };

  return { uploadFiles, updateUserProfile };
};

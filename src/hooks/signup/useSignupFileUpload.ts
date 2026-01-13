
import { supabase } from "@/integrations/supabase/client";
import { GenderType } from "@/types/database";
import {
  createBucketIfNotExists,
  uploadFileToBucket,
  getPublicUrl
} from "@/integrations/supabase/storage";

export const useSignupFileUpload = (setUploadingFiles: React.Dispatch<React.SetStateAction<boolean>>) => {
  const uploadFiles = async (userId: string, fileData: any, role: string) => {
    let idCardUrl = null;
    let profilePhotoUrl = null;
    let companyLogoUrl = null;
    let businessDocumentUrl = null;
    const errors: string[] = [];

    try {
      setUploadingFiles(true);

      if (role === 'company') {
        // Upload company logo
        if (fileData.companyLogo) {
          const fileExt = fileData.companyLogo.name.split('.').pop();
          const fileName = `${userId}/company_logo_${Date.now()}.${fileExt}`;

          try {
            const uploadResult = await uploadFileToBucket(
              fileData.companyLogo,
              'profile_photos',
              fileName
            );

            if (uploadResult.success && uploadResult.data) {
              companyLogoUrl = uploadResult.data;

            } else {
              errors.push(`Company logo: ${uploadResult.error?.message || 'Upload failed'}`);
              console.error("Company logo upload error:", uploadResult.error);
            }
          } catch (err) {
            errors.push(`Company logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error("Company logo upload exception:", err);
          }
        }

        // Upload business document
        if (fileData.businessDocument) {
          const fileExt = fileData.businessDocument.name.split('.').pop();
          const fileName = `${userId}/business_document_${Date.now()}.${fileExt}`;

          try {
            const uploadResult = await uploadFileToBucket(
              fileData.businessDocument,
              'id_cards',
              fileName
            );

            if (uploadResult.success && uploadResult.data) {
              businessDocumentUrl = uploadResult.data;

            } else {
              errors.push(`Business document: ${uploadResult.error?.message || 'Upload failed'}`);
              console.error("Business document upload error:", uploadResult.error);
            }
          } catch (err) {
            errors.push(`Business document: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error("Business document upload exception:", err);
          }
        }
      } else {
        // Promoter file uploads (existing logic)
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

            } else {
              errors.push(`Profile photo: ${uploadResult.error?.message || 'Upload failed'}`);
              console.error("Profile photo upload error:", uploadResult.error);
            }
          } catch (err) {
            errors.push(`Profile photo: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error("Profile photo upload exception:", err);
          }
        }
      }

      return { idCardUrl, profilePhotoUrl, companyLogoUrl, businessDocumentUrl, errors };
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateUserProfile = async (userId: string, formData: any, idCardUrl: string | null, profilePhotoUrl: string | null, role: string) => {
    try {


      // Generate unique code for promoters
      let uniqueCode = null;
      if (role === 'promoter') {
        try {
          const { generateUniqueCode } = await import('@/utils/uniqueCodeGenerator');
          uniqueCode = await generateUniqueCode();

        } catch (error) {
          console.error("Failed to generate unique code:", error);
          throw new Error("Failed to generate promoter code. Please try again.");
        }
      }

      if (role === 'company') {
        // Company role - only update basic profile fields
        const profileData = {
          full_name: formData.fullName || 'New Company',
          phone_number: formData.phoneNumber?.trim() || null,
          address: formData.address || '',
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        };



        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select();

        if (error) {
          console.error("Error updating profile:", error);
          throw new Error(`Profile update failed: ${error.message}`);
        }


        return data;
      } else {
        // Promoter role - update with all personal details
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
          // Enhanced bank account fields
          bank_account_holder_name: formData.bankAccountHolderName || null,
          iban_number: formData.ibanNumber || null,
          bank_name: formData.bankName || null,
          bank_country: formData.bankCountry || 'BH',
          id_card_url: idCardUrl,
          profile_photo_url: profilePhotoUrl,
          unique_code: uniqueCode, // Add generated unique code
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        };



        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select();

        if (error) {
          console.error("Error updating profile:", error);
          throw new Error(`Profile update failed: ${error.message}`);
        }


        return data;
      }
    } catch (error: any) {
      console.error("Exception updating profile:", error);
      throw error;
    }
  };

  const createCompanyProfile = async (userId: string, formData: any, logoUrl: string | null) => {
    try {


      const companyData = {
        user_id: userId,
        name: formData.companyName || '',
        registration_id: formData.companyRegistrationId || null,
        address: formData.address || '',
        website: formData.companyWebsite || null,
        industry: formData.companyIndustry || null,
        company_size: formData.companySize || null,
        description: formData.companyDescription || null,
        logo_url: logoUrl,
      };



      const { data, error } = await supabase
        .from('company_profiles')
        .insert([companyData])
        .select();

      if (error) {
        console.error("Error creating company profile:", error);
        throw new Error(`Company profile creation failed: ${error.message}`);
      }


      return data;
    } catch (error: any) {
      console.error("Exception creating company profile:", error);
      throw error;
    }
  };

  return { uploadFiles, updateUserProfile, createCompanyProfile };
};


import { useState } from "react";
import { toast } from "sonner";
import { uploadFileToBucket } from "@/integrations/supabase/storage";
import { validateFileUpload } from "@/utils/validation";

export function useFileUpload() {
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Creates a unique file path for the upload
   */
  const createFilePath = (userId: string, file: File): string => {
    const fileExt = file.name.split('.').pop();
    // Using userId as the folder name to organize files by user
    return `${userId}/${Date.now()}.${fileExt}`;
  };

  /**
   * Handles file upload for a specific file type with security validation
   */
  const handleFileUpload = async (file: File | null, bucket: string, userId: string): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      
      // Security validation for file uploads
      const allowedTypes = bucket === 'profile_photos' 
        ? ['image/jpeg', 'image/png', 'image/webp'] 
        : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      
      const maxSize = bucket === 'profile_photos' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for photos, 5MB for documents
      
      const validation = validateFileUpload(file, {
        maxSize,
        allowedTypes
      });
      
      if (!validation.isValid) {
        toast.error(`File validation failed: ${validation.errors.join(', ')}`);
        return null;
      }
      
      // Additional security checks
      if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        toast.error("Invalid file name detected");
        return null;
      }
      
      const fileName = createFilePath(userId, file);
      
      console.log(`Starting secure upload to ${bucket}/${fileName}`);
      const { success, data: url, error } = await uploadFileToBucket(file, bucket, fileName);

      if (!success || !url) {
        console.error(`Upload error: ${error?.code}`, error?.message);
        toast.error(`Failed to upload: ${error?.message}`);
        return null;
      }

      console.log(`Upload successful to ${bucket}/${fileName}`);
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during upload';
      console.error('Unexpected upload error:', errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Upload both ID card and profile photo if they exist
   */
  const uploadFiles = async (userId: string): Promise<{
    idCardUrl: string | null;
    profilePhotoUrl: string | null;
  }> => {
    const results = {
      idCardUrl: null as string | null,
      profilePhotoUrl: null as string | null
    };

    if (idCardFile) {
      results.idCardUrl = await handleFileUpload(idCardFile, 'id_cards', userId);
    }

    if (profilePhotoFile) {
      results.profilePhotoUrl = await handleFileUpload(profilePhotoFile, 'profile_photos', userId);
    }

    return results;
  };

  return {
    idCardFile,
    setIdCardFile,
    profilePhotoFile,
    setProfilePhotoFile,
    handleFileUpload,
    uploadFiles,
    isUploading
  };
}

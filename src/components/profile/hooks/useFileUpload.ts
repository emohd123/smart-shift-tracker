
import { useState } from "react";
import { toast } from "sonner";
import { uploadFileToBucket } from "@/integrations/supabase/storageUtils";

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
   * Handles file upload for a specific file type
   */
  const handleFileUpload = async (file: File | null, bucket: string, userId: string): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      const fileName = createFilePath(userId, file);
      
      console.log(`Starting upload to ${bucket}/${fileName}`);
      const { url, error } = await uploadFileToBucket(file, bucket, fileName);

      if (error) {
        console.error(`Upload error: ${error.code}`, error.message);
        toast.error(`Failed to upload: ${error.message}`);
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


import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFileUpload() {
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Create bucket if it doesn't exist
  const createBucketIfNotExists = async (bucketName: string) => {
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error(`Error checking buckets: ${bucketsError.message}`);
        return false;
      }
      
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}: ${error.message}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error in createBucketIfNotExists for ${bucketName}:`, error);
      return false;
    }
  };

  const handleFileUpload = async (file: File, bucket: string, userId: string) => {
    if (!file) return null;
    
    try {
      // Ensure bucket exists
      const bucketCreated = await createBucketIfNotExists(bucket);
      if (!bucketCreated) {
        throw new Error(`Failed to ensure bucket ${bucket} exists`);
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      console.log(`Uploading to ${bucket}/${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      throw error;
    }
  };

  return {
    idCardFile,
    setIdCardFile,
    profilePhotoFile,
    setProfilePhotoFile,
    handleFileUpload
  };
}

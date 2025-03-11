
import { supabase } from "./client";

export type StorageError = {
  message: string;
  code: string;
};

/**
 * Creates a bucket if it doesn't exist
 */
export const createBucketIfNotExists = async (bucketName: string): Promise<{ success: boolean; error?: StorageError }> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return {
        success: false,
        error: {
          message: `Error checking buckets: ${bucketsError.message}`,
          code: 'BUCKET_CHECK_ERROR'
        }
      };
    }
    
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      
      if (error) {
        return {
          success: false,
          error: {
            message: `Error creating bucket ${bucketName}: ${error.message}`,
            code: 'BUCKET_CREATE_ERROR'
          }
        };
      }
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: {
        message: `Unexpected error in createBucketIfNotExists for ${bucketName}: ${errorMessage}`,
        code: 'BUCKET_UNEXPECTED_ERROR'
      }
    };
  }
};

/**
 * Upload a file to a Supabase storage bucket
 */
export const uploadFileToBucket = async (
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string | null; error?: StorageError }> => {
  try {
    // First ensure bucket exists
    const { success, error: bucketError } = await createBucketIfNotExists(bucket);
    
    if (!success) {
      return { 
        url: null, 
        error: bucketError 
      };
    }
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (uploadError) {
      return {
        url: null,
        error: {
          message: `Error uploading file to ${bucket}/${path}: ${uploadError.message}`,
          code: 'FILE_UPLOAD_ERROR'
        }
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      url: null,
      error: {
        message: `Unexpected error uploading file to ${bucket}: ${errorMessage}`,
        code: 'UPLOAD_UNEXPECTED_ERROR'
      }
    };
  }
};

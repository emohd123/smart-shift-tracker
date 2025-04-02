
import { supabase } from "./client";

export type StorageError = {
  message: string;
  code: string;
};

/**
 * Creates a bucket if it doesn't exist
 */
export const createBucketIfNotExists = async (
  bucketName: string,
  options: { public?: boolean; fileSizeLimit?: number } = { public: true }
): Promise<{ success: boolean; error?: StorageError }> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
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
      console.log(`Bucket ${bucketName} doesn't exist, creating...`);
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: options.public ?? true,
        fileSizeLimit: options.fileSizeLimit,
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
        return {
          success: false,
          error: {
            message: `Error creating bucket ${bucketName}: ${error.message}`,
            code: 'BUCKET_CREATE_ERROR'
          }
        };
      }
      console.log(`Bucket ${bucketName} created successfully`);
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error in createBucketIfNotExists for ${bucketName}:`, error);
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
  path: string,
  options: { upsert?: boolean; cacheControl?: string } = {}
): Promise<{ url: string | null; error?: StorageError }> => {
  try {
    // First ensure bucket exists
    const { success, error: bucketError } = await createBucketIfNotExists(bucket);
    
    if (!success) {
      console.error("Failed to ensure bucket exists:", bucketError);
      return { 
        url: null, 
        error: bucketError 
      };
    }
    
    // Upload the file
    console.log(`Uploading file to ${bucket}/${path}...`);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options.upsert ?? true,
        cacheControl: options.cacheControl ?? '3600',
      });

    if (uploadError) {
      console.error(`Error uploading file to ${bucket}/${path}:`, uploadError);
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

    console.log(`File uploaded successfully, public URL:`, publicUrl);
    return { url: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error uploading file to ${bucket}:`, error);
    return {
      url: null,
      error: {
        message: `Unexpected error uploading file to ${bucket}: ${errorMessage}`,
        code: 'UPLOAD_UNEXPECTED_ERROR'
      }
    };
  }
};

/**
 * Get a file from a Supabase storage bucket
 */
export const getFileFromBucket = async (
  bucket: string,
  path: string
): Promise<{ data: Blob | null; error?: StorageError }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
      
    if (error) {
      console.error(`Error downloading file from ${bucket}/${path}:`, error);
      return {
        data: null,
        error: {
          message: `Error downloading file from ${bucket}/${path}: ${error.message}`,
          code: 'FILE_DOWNLOAD_ERROR'
        }
      };
    }
    
    return { data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error downloading file from ${bucket}:`, error);
    return {
      data: null,
      error: {
        message: `Unexpected error downloading file from ${bucket}: ${errorMessage}`,
        code: 'DOWNLOAD_UNEXPECTED_ERROR'
      }
    };
  }
};

/**
 * Delete a file from a Supabase storage bucket
 */
export const deleteFileFromBucket = async (
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: StorageError }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) {
      console.error(`Error deleting file from ${bucket}/${path}:`, error);
      return {
        success: false,
        error: {
          message: `Error deleting file from ${bucket}/${path}: ${error.message}`,
          code: 'FILE_DELETE_ERROR'
        }
      };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error deleting file from ${bucket}:`, error);
    return {
      success: false,
      error: {
        message: `Unexpected error deleting file from ${bucket}: ${errorMessage}`,
        code: 'DELETE_UNEXPECTED_ERROR'
      }
    };
  }
};

/**
 * Check if file exists in a bucket
 */
export const fileExistsInBucket = async (
  bucket: string,
  path: string
): Promise<{ exists: boolean; error?: StorageError }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        limit: 1,
        offset: 0,
        search: path.split('/').pop()
      });
    
    if (error) {
      console.error(`Error checking if file exists in ${bucket}/${path}:`, error);
      return {
        exists: false,
        error: {
          message: `Error checking if file exists: ${error.message}`,
          code: 'FILE_CHECK_ERROR'
        }
      };
    }
    
    return { 
      exists: data && data.length > 0 && data.some(item => 
        item.name === path.split('/').pop()
      )
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error checking if file exists in ${bucket}:`, error);
    return {
      exists: false,
      error: {
        message: `Unexpected error checking if file exists: ${errorMessage}`,
        code: 'FILE_EXISTS_UNEXPECTED_ERROR'
      }
    };
  }
};

/**
 * List all files in a bucket or folder
 */
export const listFilesInBucket = async (
  bucket: string,
  folder: string = ''
): Promise<{ files: any[] | null; error?: StorageError }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);
      
    if (error) {
      console.error(`Error listing files in ${bucket}/${folder}:`, error);
      return {
        files: null,
        error: {
          message: `Error listing files: ${error.message}`,
          code: 'FILE_LIST_ERROR'
        }
      };
    }
    
    return { files: data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error listing files in ${bucket}:`, error);
    return {
      files: null,
      error: {
        message: `Unexpected error listing files: ${errorMessage}`,
        code: 'FILE_LIST_UNEXPECTED_ERROR'
      }
    };
  }
};

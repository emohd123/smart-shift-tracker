
import { supabase } from "../client";
import { StorageError, StorageResult } from "./types";
import { createBucketIfNotExists } from "./bucketUtils";

/**
 * Upload a file to a Supabase storage bucket
 */
export const uploadFileToBucket = async (
  file: File,
  bucket: string,
  path: string,
  options: { upsert?: boolean; cacheControl?: string } = {}
): Promise<StorageResult<string>> => {
  try {
    // First ensure bucket exists
    const { success, error: bucketError } = await createBucketIfNotExists(bucket);
    
    if (!success) {
      console.error("Failed to ensure bucket exists:", bucketError);
      return { 
        success: false, 
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
        success: false,
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
    return { success: true, data: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error uploading file to ${bucket}:`, error);
    return {
      success: false,
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
): Promise<StorageResult<Blob>> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
      
    if (error) {
      console.error(`Error downloading file from ${bucket}/${path}:`, error);
      return {
        success: false,
        error: {
          message: `Error downloading file from ${bucket}/${path}: ${error.message}`,
          code: 'FILE_DOWNLOAD_ERROR'
        }
      };
    }
    
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error downloading file from ${bucket}:`, error);
    return {
      success: false,
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
): Promise<StorageResult<void>> => {
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
): Promise<StorageResult<boolean>> => {
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
        success: false,
        error: {
          message: `Error checking if file exists: ${error.message}`,
          code: 'FILE_CHECK_ERROR'
        }
      };
    }
    
    const exists = data && data.length > 0 && data.some(item => 
      item.name === path.split('/').pop()
    );
    
    return { 
      success: true,
      data: exists
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error checking if file exists in ${bucket}:`, error);
    return {
      success: false,
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
): Promise<StorageResult<any[]>> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);
      
    if (error) {
      console.error(`Error listing files in ${bucket}/${folder}:`, error);
      return {
        success: false,
        error: {
          message: `Error listing files: ${error.message}`,
          code: 'FILE_LIST_ERROR'
        },
        data: []
      };
    }
    
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Unexpected error listing files in ${bucket}:`, error);
    return {
      success: false,
      error: {
        message: `Unexpected error listing files: ${errorMessage}`,
        code: 'FILE_LIST_UNEXPECTED_ERROR'
      },
      data: []
    };
  }
};

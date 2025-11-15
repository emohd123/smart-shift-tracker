
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createBucketIfNotExists } from "./bucketUtils";
import { createErrorResponse, createSuccessResponse } from "./common";

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
    // NOTE: Buckets (id_cards, profile_photos) must already exist in Supabase
    // They are created during initial setup with proper RLS policies
    
    // Upload the file
    console.log(`Uploading file to ${bucket}/${path}...`);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options.upsert ?? true,
        cacheControl: options.cacheControl ?? '3600',
      });

    if (uploadError) {
      return createErrorResponse<string>(
        `Error uploading file to ${bucket}/${path}: ${uploadError.message}`,
        'FILE_UPLOAD_ERROR',
        uploadError
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log(`File uploaded successfully, public URL:`, publicUrl);
    return createSuccessResponse<string>(publicUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<string>(
      `Unexpected error uploading file to ${bucket}: ${errorMessage}`,
      'UPLOAD_UNEXPECTED_ERROR',
      error
    );
  }
};

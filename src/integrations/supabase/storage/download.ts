
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";

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
      return createErrorResponse<Blob>(
        `Error downloading file from ${bucket}/${path}: ${error.message}`,
        'FILE_DOWNLOAD_ERROR',
        error
      );
    }
    
    return createSuccessResponse<Blob>(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<Blob>(
      `Unexpected error downloading file from ${bucket}: ${errorMessage}`,
      'DOWNLOAD_UNEXPECTED_ERROR',
      error
    );
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
      return createErrorResponse<void>(
        `Error deleting file from ${bucket}/${path}: ${error.message}`,
        'FILE_DELETE_ERROR',
        error
      );
    }
    
    return createSuccessResponse<void>();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<void>(
      `Unexpected error deleting file from ${bucket}: ${errorMessage}`,
      'DELETE_UNEXPECTED_ERROR',
      error
    );
  }
};

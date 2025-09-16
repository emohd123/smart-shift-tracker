
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";

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
      return createErrorResponse<boolean>(
        `Error checking if file exists in ${bucket}/${path}: ${error.message}`,
        'FILE_CHECK_ERROR',
        error
      );
    }
    
    const exists = data && data.length > 0 && data.some(item => 
      item.name === path.split('/').pop()
    );
    
    return createSuccessResponse<boolean>(exists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<boolean>(
      `Unexpected error checking if file exists: ${errorMessage}`,
      'FILE_EXISTS_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * List all files in a bucket or folder
 */
export const listFilesInBucket = async (
  bucket: string,
  folder: string = ''
): Promise<StorageResult<unknown[]>> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);
      
    if (error) {
      return createErrorResponse<unknown[]>(
        `Error listing files in ${bucket}/${folder}: ${error.message}`,
        'LIST_FILES_ERROR',
        error
      );
    }
    
    return createSuccessResponse<unknown[]>(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<unknown[]>(
      `Unexpected error listing files: ${errorMessage}`,
      'LIST_FILES_UNEXPECTED_ERROR',
      error
    );
  }
};

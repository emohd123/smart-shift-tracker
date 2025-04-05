
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";
import { normalizePath, joinPaths } from "./pathUtils";

/**
 * Create a folder in a bucket
 * Note: Supabase storage doesn't have explicit folder creation,
 * this creates an empty .folder file to simulate the folder
 */
export const createFolder = async (
  bucket: string,
  folderPath: string
): Promise<StorageResult<string>> => {
  try {
    const normalizedPath = normalizePath(folderPath);
    const folderMarkerPath = normalizedPath.endsWith('/') 
      ? `${normalizedPath}.folder` 
      : `${normalizedPath}/.folder`;
    
    // Upload an empty file to mark the folder
    const { error } = await supabase.storage
      .from(bucket)
      .upload(folderMarkerPath, new Blob([]), {
        contentType: 'application/x-directory',
        upsert: true
      });
      
    if (error) {
      return createErrorResponse<string>(
        `Error creating folder in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_CREATE_ERROR',
        error
      );
    }
    
    return createSuccessResponse<string>(normalizedPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<string>(
      `Unexpected error creating folder: ${errorMessage}`,
      'FOLDER_CREATE_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * Check if a folder exists in a bucket
 */
export const folderExistsInBucket = async (
  bucket: string,
  folderPath: string
): Promise<StorageResult<boolean>> => {
  try {
    const normalizedPath = normalizePath(folderPath);
    
    // List files in the folder
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(normalizedPath, { limit: 1 });
      
    if (error && error.message !== 'The resource was not found') {
      return createErrorResponse<boolean>(
        `Error checking if folder exists in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_CHECK_ERROR',
        error
      );
    }
    
    // If we got data or a specific error, the folder exists
    const exists = !!data && data.length > 0;
    
    return createSuccessResponse<boolean>(exists);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<boolean>(
      `Unexpected error checking if folder exists: ${errorMessage}`,
      'FOLDER_EXISTS_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * List all items in a folder
 */
export const listFolder = async (
  bucket: string,
  folderPath: string = '',
  options?: { limit?: number; offset?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }
): Promise<StorageResult<any[]>> => {
  try {
    const normalizedPath = normalizePath(folderPath);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(normalizedPath, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: options?.sortBy
      });
      
    if (error) {
      return createErrorResponse<any[]>(
        `Error listing folder in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_LIST_ERROR',
        error
      );
    }
    
    return createSuccessResponse<any[]>(data || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<any[]>(
      `Unexpected error listing folder: ${errorMessage}`,
      'FOLDER_LIST_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * Delete a folder and all its contents
 */
export const deleteFolder = async (
  bucket: string,
  folderPath: string
): Promise<StorageResult<void>> => {
  try {
    const normalizedPath = normalizePath(folderPath);
    
    // First list all items in the folder
    const listResult = await listFolder(bucket, normalizedPath, { limit: 1000 });
    
    if (!listResult.success) {
      return createErrorResponse<void>(
        `Error listing folder contents for deletion: ${listResult.error?.message}`,
        'FOLDER_DELETE_LIST_ERROR',
        listResult.error
      );
    }
    
    const items = listResult.data || [];
    
    // Recursively delete subfolders and files
    const deletionPromises = items.map(async (item) => {
      const itemPath = joinPaths(normalizedPath, item.name);
      
      if (item.id === '.folder' || item.id === '.emptyFolderPlaceholder') {
        // Skip folder markers
        return;
      }
      
      if (item.metadata && item.metadata.mimetype === 'application/x-directory') {
        // Recursively delete subfolder
        return deleteFolder(bucket, itemPath);
      } else {
        // Delete file
        const { error } = await supabase.storage
          .from(bucket)
          .remove([itemPath]);
          
        if (error) {
          console.error(`Error deleting ${itemPath}:`, error);
        }
      }
    });
    
    // Wait for all deletions to complete
    await Promise.all(deletionPromises);
    
    // Finally, delete the folder marker if it exists
    const { error } = await supabase.storage
      .from(bucket)
      .remove([`${normalizedPath}/.folder`]);
      
    if (error && error.message !== 'The resource was not found') {
      console.error(`Error deleting folder marker:`, error);
    }
    
    return createSuccessResponse<void>();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<void>(
      `Unexpected error deleting folder: ${errorMessage}`,
      'FOLDER_DELETE_UNEXPECTED_ERROR',
      error
    );
  }
};

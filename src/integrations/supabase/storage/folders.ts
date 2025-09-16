
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";
import { normalizePath, joinPaths } from "./pathUtils";
import { FileObject } from "@supabase/supabase-js";

/**
 * Create a folder in a bucket
 */
export const createFolder = async (
  bucket: string,
  folderPath: string
): Promise<StorageResult<void>> => {
  try {
    // Normalize and ensure path ends with '/'
    let normalizedPath = normalizePath(folderPath);
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
    
    // Create an empty file as a placeholder
    const { error } = await supabase.storage
      .from(bucket)
      .upload(`${normalizedPath}.folder`, new Blob([]));
      
    if (error) {
      return createErrorResponse<void>(
        `Error creating folder in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_CREATE_ERROR',
        error
      );
    }
    
    return createSuccessResponse<void>();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<void>(
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
    // Normalize path and ensure it ends with '/'
    let normalizedPath = normalizePath(folderPath);
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
    
    // List the folder contents
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(normalizedPath);
      
    // If we can list contents, it exists
    if (!error) {
      return createSuccessResponse<boolean>(true);
    }
    
    // Check for parent folder
    const parentPath = normalizedPath.split('/').slice(0, -2).join('/');
    const folderName = normalizedPath.split('/').slice(-2)[0];
    
    const { data: parentContents, error: parentError } = await supabase.storage
      .from(bucket)
      .list(parentPath);
      
    if (parentError) {
      return createErrorResponse<boolean>(
        `Error checking if folder exists in ${bucket}/${normalizedPath}: ${parentError.message}`,
        'FOLDER_CHECK_ERROR',
        parentError
      );
    }
    
    // Check if any item in the parent folder starts with our folder name
    const exists = parentContents?.some(item => 
      item.name === folderName || item.name === `${folderName}/`
    );
    
    return createSuccessResponse<boolean>(!!exists);
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
 * List contents of a folder
 */
export const listFolder = async (
  bucket: string,
  folderPath: string
): Promise<StorageResult<FileObject[]>> => {
  try {
    // Normalize path
    const normalizedPath = normalizePath(folderPath);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(normalizedPath);
      
    if (error) {
      return createErrorResponse<FileObject[]>(
        `Error listing folder in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_LIST_ERROR',
        error
      );
    }
    
    return createSuccessResponse<FileObject[]>(data || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<FileObject[]>(
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
    // Normalize path and ensure it ends with '/'
    let normalizedPath = normalizePath(folderPath);
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
    
    // First list all files in the folder
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(normalizedPath);
      
    if (error) {
      return createErrorResponse<void>(
        `Error listing folder contents for deletion in ${bucket}/${normalizedPath}: ${error.message}`,
        'FOLDER_DELETE_LIST_ERROR',
        error
      );
    }
    
    // Process each item in the folder
    for (const item of data || []) {
      const itemPath = joinPaths(normalizedPath, item.name);
      
      if (item.id) {
        // It's a file, delete it
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([itemPath]);
          
        if (deleteError) {
          console.error(`Error deleting file ${itemPath}:`, deleteError);
          // Continue with other files
        }
      } else {
        // It's a subfolder, recursively delete it
        await deleteFolder(bucket, itemPath);
      }
    }
    
    // Delete the .folder placeholder if it exists
    const { error: placeholderError } = await supabase.storage
      .from(bucket)
      .remove([`${normalizedPath}.folder`]);
      
    if (placeholderError) {
      console.error(`Error deleting folder placeholder:`, placeholderError);
      // Not critical, continue
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


import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";

// Simple in-memory cache for public URLs
const urlCache = new Map<string, string>();

/**
 * Get a public URL for a file in a bucket
 */
export const getPublicUrl = (
  bucket: string,
  path: string,
  options?: { disableCache?: boolean }
): StorageResult<string> => {
  try {
    const cacheKey = `${bucket}/${path}`;
    
    // Check cache first unless cache is disabled
    if (!options?.disableCache && urlCache.has(cacheKey)) {
      return createSuccessResponse<string>(urlCache.get(cacheKey) as string);
    }
    
    // Get the public URL from Supabase
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    if (!data.publicUrl) {
      return createErrorResponse<string>(
        `Failed to get public URL for ${bucket}/${path}`,
        'PUBLIC_URL_ERROR'
      );
    }
    
    // Store in cache for future use
    if (!options?.disableCache) {
      urlCache.set(cacheKey, data.publicUrl);
    }
    
    return createSuccessResponse<string>(data.publicUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<string>(
      `Unexpected error getting public URL: ${errorMessage}`,
      'PUBLIC_URL_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * Clear all cached URLs or for a specific bucket/path
 */
export const clearUrlCache = (bucket?: string, path?: string): void => {
  if (bucket && path) {
    // Clear specific URL
    urlCache.delete(`${bucket}/${path}`);
  } else if (bucket) {
    // Clear all URLs for a bucket
    Array.from(urlCache.keys())
      .filter(key => key.startsWith(`${bucket}/`))
      .forEach(key => urlCache.delete(key));
  } else {
    // Clear entire cache
    urlCache.clear();
  }
};

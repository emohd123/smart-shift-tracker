
import { supabase } from "../client";
import { StorageResult } from "./types";
import { createErrorResponse, createSuccessResponse } from "./common";
import { normalizePath } from "./pathUtils";
import { getPublicUrl } from "./urls";

/**
 * Options for image transformations
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'webp' | 'avif' | 'jpg';
  quality?: number; // 1-100
}

/**
 * Get a transformed image URL
 */
export const getTransformedImageUrl = (
  bucket: string,
  path: string,
  options: ImageTransformOptions
): StorageResult<string> => {
  try {
    // First get the public URL
    const urlResult = getPublicUrl(bucket, path, { disableCache: true });
    
    if (!urlResult.success || !urlResult.data) {
      return createErrorResponse<string>(
        `Failed to get public URL for image: ${urlResult.error?.message}`,
        'IMAGE_TRANSFORM_URL_ERROR',
        urlResult.error
      );
    }
    
    const publicUrl = urlResult.data;
    const url = new URL(publicUrl);
    
    // Add transformation parameters
    if (options.width) {
      url.searchParams.append('width', options.width.toString());
    }
    
    if (options.height) {
      url.searchParams.append('height', options.height.toString());
    }
    
    if (options.resize) {
      url.searchParams.append('resize', options.resize);
    }
    
    if (options.format && options.format !== 'origin') {
      url.searchParams.append('format', options.format);
    }
    
    if (options.quality && options.quality >= 1 && options.quality <= 100) {
      url.searchParams.append('quality', options.quality.toString());
    }
    
    return createSuccessResponse<string>(url.toString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse<string>(
      `Unexpected error generating transformed image URL: ${errorMessage}`,
      'IMAGE_TRANSFORM_UNEXPECTED_ERROR',
      error
    );
  }
};

/**
 * Checks if a file is an image based on its extension
 */
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.bmp'];
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(ext);
};

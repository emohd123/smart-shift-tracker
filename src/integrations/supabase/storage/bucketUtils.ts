
import { supabase } from "../client";
import { StorageError, StorageResult } from "./types";

/**
 * Creates a bucket if it doesn't exist
 */
export const createBucketIfNotExists = async (
  bucketName: string,
  options: { public?: boolean; fileSizeLimit?: number } = { public: true }
): Promise<StorageResult<void>> => {
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

    } else {

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
 * List all buckets in storage
 */
export const listBuckets = async (): Promise<StorageResult<any[]>> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("Error listing buckets:", error);
      return {
        success: false,
        error: {
          message: `Error listing buckets: ${error.message}`,
          code: 'BUCKET_LIST_ERROR'
        },
        data: []
      };
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Unexpected error listing buckets:", error);
    return {
      success: false,
      error: {
        message: `Unexpected error listing buckets: ${errorMessage}`,
        code: 'BUCKET_LIST_UNEXPECTED_ERROR'
      },
      data: []
    };
  }
};

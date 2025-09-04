
import { StorageError, StorageResult } from "./types";

/**
 * Creates a standardized error response
 */
export const createErrorResponse = <T>(
  errorMessage: string, 
  errorCode: string,
  originalError?: any
): StorageResult<T> => {
  console.error(`Storage error (${errorCode}):`, originalError || errorMessage);
  return {
    success: false,
    error: {
      message: errorMessage,
      code: errorCode
    }
  };
};

/**
 * Creates a successful response
 */
export const createSuccessResponse = <T>(data?: T): StorageResult<T> => {
  return { 
    success: true, 
    data 
  };
};

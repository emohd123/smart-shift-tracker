
// Export all storage utility functions from their respective modules
export * from './types';
export * from './bucketUtils';
export * from './upload';
export * from './download';
export * from './management';
export * from './common';
export * from './pathUtils';
export * from './urls';
export * from './folders';
export * from './images';

// Re-export for backward compatibility
import { uploadFileToBucket } from './upload';
import { getFileFromBucket, deleteFileFromBucket } from './download';
import { fileExistsInBucket, listFilesInBucket } from './management';
import { createBucketIfNotExists, listBuckets } from './bucketUtils';
import { normalizePath, joinPaths, getParentPath, getFileName } from './pathUtils';
import { getPublicUrl, clearUrlCache } from './urls';
import { createFolder, folderExistsInBucket, listFolder, deleteFolder } from './folders';
import { getTransformedImageUrl, isImageFile } from './images';

export {
  // Bucket operations
  createBucketIfNotExists,
  listBuckets,
  
  // File operations
  uploadFileToBucket,
  getFileFromBucket,
  deleteFileFromBucket,
  fileExistsInBucket,
  listFilesInBucket,
  
  // Path utilities
  normalizePath,
  joinPaths,
  getParentPath,
  getFileName,
  
  // URL handling
  getPublicUrl,
  clearUrlCache,
  
  // Folder operations
  createFolder,
  folderExistsInBucket,
  listFolder,
  deleteFolder,
  
  // Image transformations
  getTransformedImageUrl,
  isImageFile
};


// This file is maintained for backwards compatibility
// It re-exports all functionality from the new storage module structure
// In the future, import directly from '@/integrations/supabase/storage'

import {
  createBucketIfNotExists,
  uploadFileToBucket,
  getFileFromBucket,
  deleteFileFromBucket,
  fileExistsInBucket,
  listFilesInBucket,
  normalizePath,
  joinPaths,
  getParentPath,
  getFileName,
  getPublicUrl,
  clearUrlCache,
  createFolder,
  folderExistsInBucket,
  listFolder,
  deleteFolder,
  getTransformedImageUrl,
  isImageFile,
  type StorageError,
  type ImageTransformOptions
} from './storage';

export {
  createBucketIfNotExists,
  uploadFileToBucket,
  getFileFromBucket,
  deleteFileFromBucket,
  fileExistsInBucket,
  listFilesInBucket,
  normalizePath,
  joinPaths,
  getParentPath,
  getFileName,
  getPublicUrl,
  clearUrlCache,
  createFolder,
  folderExistsInBucket,
  listFolder,
  deleteFolder,
  getTransformedImageUrl,
  isImageFile,
  type StorageError,
  type ImageTransformOptions
};

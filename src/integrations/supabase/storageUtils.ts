
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
  StorageError
} from './storage';

export {
  createBucketIfNotExists,
  uploadFileToBucket,
  getFileFromBucket,
  deleteFileFromBucket,
  fileExistsInBucket,
  listFilesInBucket,
  StorageError
};

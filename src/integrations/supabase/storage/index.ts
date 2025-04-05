
// Export all storage utility functions from their respective modules
export * from './types';
export * from './bucketUtils';
export * from './upload';
export * from './download';
export * from './management';
export * from './common';

// Re-export for backward compatibility
import { uploadFileToBucket } from './upload';
import { getFileFromBucket, deleteFileFromBucket } from './download';
import { fileExistsInBucket, listFilesInBucket } from './management';
import { createBucketIfNotExists } from './bucketUtils';

export {
  createBucketIfNotExists,
  uploadFileToBucket,
  getFileFromBucket,
  deleteFileFromBucket,
  fileExistsInBucket,
  listFilesInBucket
};

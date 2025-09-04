
/**
 * Utilities for consistent path handling in storage
 */

/**
 * Normalize a storage path by removing duplicate slashes and ensuring
 * the path doesn't start with a slash
 */
export const normalizePath = (path: string): string => {
  // Remove leading slash if present
  let normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Replace multiple consecutive slashes with a single slash
  normalizedPath = normalizedPath.replace(/\/+/g, '/');
  
  return normalizedPath;
};

/**
 * Join path segments together with proper slash handling
 */
export const joinPaths = (...paths: string[]): string => {
  const joined = paths
    .filter(Boolean) // Remove empty segments
    .map(p => p.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
    .join('/');
    
  return joined;
};

/**
 * Get the parent folder path from a file path
 */
export const getParentPath = (path: string): string => {
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return ''; // No parent, return root
  }
  
  return normalized.substring(0, lastSlashIndex);
};

/**
 * Get the filename from a path
 */
export const getFileName = (path: string): string => {
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return normalized; // No slashes, return the whole path
  }
  
  return normalized.substring(lastSlashIndex + 1);
};

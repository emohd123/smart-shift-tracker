
export type StorageError = {
  message: string;
  code: string;
};

export type StorageResult<T> = {
  success: boolean;
  data?: T;
  error?: StorageError;
};

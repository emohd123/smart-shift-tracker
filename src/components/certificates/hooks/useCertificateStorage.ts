
import { useStorageOperations } from "./useStorageOperations";
import { useCertificateData } from "./useCertificateData";
import { useCertificateVerification } from "./useCertificateVerification";

/**
 * Hook combining all certificate storage operations for backward compatibility
 */
export const useCertificateStorage = () => {
  const storageOps = useStorageOperations();
  const certificateData = useCertificateData();
  const verification = useCertificateVerification();
  
  return {
    ...storageOps,
    ...certificateData,
    ...verification
  };
};

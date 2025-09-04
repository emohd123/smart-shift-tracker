
import { toast, Toaster } from "sonner";
import { useEffect } from "react";

interface ToastContainerProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  closeButton?: boolean;
}

export function ToastContainer({ 
  position = "top-right", 
  closeButton = true 
}: ToastContainerProps) {
  return (
    <Toaster 
      position={position}
      closeButton={closeButton}
      theme="system"
      richColors
      className="!font-sans"
    />
  );
}

// Helper functions for consistent toasts
export const showSuccessToast = (message: string, description?: string) => {
  toast.success(description || message, {
    description: description ? message : undefined,
  });
};

export const showErrorToast = (message: string, description?: string) => {
  toast.error(description || message, {
    description: description ? message : undefined,
  });
};

export const showInfoToast = (message: string, description?: string) => {
  toast.info(description || message, {
    description: description ? message : undefined,
  });
};

export const showWarningToast = (message: string, description?: string) => {
  toast.warning(description || message, {
    description: description ? message : undefined,
  });
};

// Hook for handling global app notifications
export function useAppNotifications() {
  // Could add app-wide notification logic here
  useEffect(() => {
    // Example: handle offline/online status
    const handleOffline = () => {
      showWarningToast("You're offline", "Some features may not work until you reconnect");
    };
    
    const handleOnline = () => {
      showSuccessToast("Back online", "Connection restored");
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}

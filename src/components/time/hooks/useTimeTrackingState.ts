
import { useState } from "react";

export function useTimeTrackingState() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [timeLogId, setTimeLogId] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  return {
    isTracking,
    setIsTracking,
    startTime,
    setStartTime,
    loading,
    setLoading,
    locationVerified,
    setLocationVerified,
    showLocationError,
    setShowLocationError,
    timeLogId,
    setTimeLogId,
    permissionDenied,
    setPermissionDenied
  };
}

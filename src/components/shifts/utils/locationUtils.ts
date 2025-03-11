
/**
 * Utility functions for handling location-based operations
 */

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Check if a user is within the allowed radius of a location
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @param targetLat Target location latitude
 * @param targetLng Target location longitude
 * @param radius Allowed radius in meters (default: 100m)
 * @returns Boolean indicating if user is within radius
 */
export function isWithinRadius(
  userLat: number, 
  userLng: number, 
  targetLat: number, 
  targetLng: number, 
  radius: number = 100
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radius;
}

/**
 * Get user's current location
 * @returns Promise that resolves to user's coordinates
 */
export function getCurrentLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true }
    );
  });
}

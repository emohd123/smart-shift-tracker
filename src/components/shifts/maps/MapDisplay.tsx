
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type MapDisplayProps = {
  location: { lat: number; lng: number } | null;
  radius: number;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  loading: boolean;
};

export default function MapDisplay({ 
  location, 
  radius, 
  onLocationChange,
  loading
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Cleanup function to handle map resources properly
  const cleanupMapResources = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
  };

  // Initialize the Google Maps script when component mounts
  useEffect(() => {
    // Prevent multiple initializations
    if (window.google?.maps && !mapInitialized && mapRef.current) {
      initializeMap();
      return;
    }

    // Define initMap function for global callback
    const initMapCallback = () => {
      if (mapRef.current && !mapInitialized && window.google?.maps) {
        setMapLoaded(true);
        initializeMap();
      }
    };

    // Set global callback
    window.initMap = initMapCallback;
    
    // Error handler for the Google Maps script
    window.gm_authFailure = () => {
      setMapError("Google Maps couldn't load due to an authentication error. The API key may not be configured for this domain.");
      setMapLoaded(false);
    };
    
    // Check if Maps API is already loaded
    if (window.google?.maps) {
      window.initMap();
    }

    return () => {
      // Cleanup
      cleanupMapResources();
      
      // Reset the global functions
      window.initMap = function() {};
      window.gm_authFailure = function() {};
    };
  }, []);

  // Update marker and circle when location or radius changes
  useEffect(() => {
    if (mapInstanceRef.current && location && mapLoaded && !mapError) {
      updateMarkerAndCircle();
    }
  }, [location, radius, mapLoaded, mapError]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;
    
    try {
      setMapInitialized(true);
      // Use existing location if available, otherwise default to LA
      const position = location || { lat: 34.0522, lng: -118.2437 };
      
      // Create map
      const mapOptions = {
        center: position,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      };
      
      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      // Add click listener to map
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onLocationChange({ 
            lat: e.latLng.lat(), 
            lng: e.latLng.lng() 
          });
        }
      });
      
      if (location) {
        updateMarkerAndCircle();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapInitialized(false);
      setMapError("Failed to initialize Google Maps. Please try again later.");
    }
  };

  const updateMarkerAndCircle = () => {
    if (!mapInstanceRef.current || !location || !window.google?.maps) return;
    
    try {
      // Clean up existing marker and circle first
      cleanupMapResources();

      // Create new marker
      markerRef.current = new google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: "Shift Location"
      });
      
      // Add drag end listener to marker
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current?.getPosition();
        if (position) {
          onLocationChange({ 
            lat: position.lat(), 
            lng: position.lng() 
          });
        }
      });
      
      // Create new circle
      circleRef.current = new google.maps.Circle({
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map: mapInstanceRef.current,
        center: location,
        radius: radius
      });
      
      // Center map on location
      mapInstanceRef.current.panTo(location);
    } catch (error) {
      console.error("Error updating marker/circle:", error);
      setMapError("Error updating map markers. Please try refreshing the page.");
    }
  };

  // Display error message if map failed to load
  if (mapError) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-60 text-center space-y-2 text-muted-foreground">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h3 className="font-medium">Map Loading Error</h3>
            <p className="text-sm">{mapError}</p>
            <p className="text-xs mt-2">
              If you're a developer, check the JavaScript console for more details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-md border border-border"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {(loading || !mapLoaded) && (
            <div className="flex items-center justify-center h-full w-full bg-background/80 absolute inset-0 z-10 rounded-md">
              <div className="text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Use this single declaration for the window interface extension
declare global {
  interface Window {
    initMap: () => void;
    gm_authFailure: () => void;
    google?: {
      maps: typeof google.maps;
    };
  }
}


import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

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

  // Initialize the map when the component mounts
  useEffect(() => {
    // Define cleanup function to handle map resources
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

    // Define initMap function for global callback
    window.initMap = function() {
      if (mapRef.current && !mapInitialized && window.google?.maps) {
        setMapLoaded(true);
        initializeMap();
      }
    };
    
    // Check if Maps API is already loaded
    if (window.google?.maps) {
      window.initMap();
    }

    return () => {
      cleanupMapResources();
      
      // Reset the global initMap function to avoid conflicts
      window.initMap = function() {};
    };
  }, []);

  // Update marker and circle when location or radius changes
  useEffect(() => {
    if (mapInstanceRef.current && location && mapLoaded) {
      updateMarkerAndCircle();
    }
  }, [location, radius, mapLoaded]);

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
    }
  };

  const updateMarkerAndCircle = () => {
    if (!mapInstanceRef.current || !location || !window.google?.maps) return;
    
    try {
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(location);
      } else {
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
      }
      
      // Update or create circle
      if (circleRef.current) {
        circleRef.current.setCenter(location);
        circleRef.current.setRadius(radius);
      } else {
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
      }
      
      // Center map on location
      mapInstanceRef.current.panTo(location);
    } catch (error) {
      console.error("Error updating marker/circle:", error);
    }
  };

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

// Correctly define the window interface extension
declare global {
  interface Window {
    initMap: () => void;
    google?: {
      maps: any;
    };
  }
}

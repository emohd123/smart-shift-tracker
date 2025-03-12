
import { useEffect, useRef, useState, useCallback } from "react";
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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Initialize the Google Maps script once
  useEffect(() => {
    // Check if the script is already loaded or in the process of loading
    if (window.google?.maps || document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    // Use a placeholder for the API key - you should replace this with a valid key
    // This will be a more secure approach in the future
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD5bFUxo4JzYGOKL-dlzZgzlZZfNnJ3L08&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Define a global callback function
    window.initMap = () => {
      setScriptLoaded(true);
    };

    document.head.appendChild(script);
    
    return () => {
      // Clean up the global callback when the component unmounts
      delete window.initMap;
      // We don't remove the script because other components might be using it
    };
  }, []);

  // Initialize the map when script is loaded and ref is available
  useEffect(() => {
    if (scriptLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [scriptLoaded]);

  // Update marker and circle when location or radius changes
  useEffect(() => {
    if (mapInstanceRef.current && location) {
      updateMarkerAndCircle();
    }
  }, [location, radius]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;
    
    try {
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
      
      updateMarkerAndCircle();
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [location, onLocationChange]);

  const updateMarkerAndCircle = useCallback(() => {
    if (!mapInstanceRef.current || !location || !window.google || !window.google.maps) return;
    
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
        const position = markerRef.current!.getPosition();
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
  }, [location, radius, onLocationChange]);

  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-md border border-border"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {(loading || !scriptLoaded) && (
            <div className="flex items-center justify-center h-full">
              Loading map...
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
  }
}

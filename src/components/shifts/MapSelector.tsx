
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Save, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "./utils/locationUtils";
import { supabase } from "@/integrations/supabase/client";

type MapSelectorProps = {
  shiftId: string;
  onSave?: () => void;
};

export default function MapSelector({ shiftId, onSave }: MapSelectorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [radius, setRadius] = useState(100);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Check if location already exists for this shift
  useEffect(() => {
    const checkExistingLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('shift_locations')
          .select('*')
          .eq('shift_id', shiftId)
          .single();
          
        if (error) {
          console.error("Error fetching shift location:", error);
          return;
        }
        
        if (data) {
          setLocation({ 
            lat: parseFloat(data.latitude), 
            lng: parseFloat(data.longitude) 
          });
          setRadius(data.radius);
        }
      } catch (error) {
        console.error("Error checking existing location:", error);
      }
    };
    
    checkExistingLocation();
  }, [shiftId]);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD5bFUxo4JzYGOKL-dlzZgzlZZfNnJ3L08&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    } else {
      initializeMap();
    }
  }, []);

  // Update marker and circle when location or radius changes
  useEffect(() => {
    if (mapInstanceRef.current && location) {
      updateMarkerAndCircle();
    }
  }, [location, radius]);

  const initializeMap = async () => {
    try {
      setLoading(true);
      
      // Start with default location (or user's location if available)
      let startPosition = { lat: 34.0522, lng: -118.2437 }; // Default to LA
      
      try {
        const coords = await getCurrentLocation();
        startPosition = { lat: coords.latitude, lng: coords.longitude };
      } catch (error) {
        console.warn("Could not get user location:", error);
      }
      
      // Use existing location if available
      const position = location || startPosition;
      
      // Create map
      const mapOptions = {
        center: position,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      };
      
      const map = new google.maps.Map(mapRef.current!, mapOptions);
      mapInstanceRef.current = map;
      
      // Create marker and circle
      if (!location) {
        setLocation(position);
      }
      
      // Add click listener to map
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          setLocation({ 
            lat: e.latLng.lat(), 
            lng: e.latLng.lng() 
          });
        }
      });
      
      updateMarkerAndCircle();
      setLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast({
        title: "Map Error",
        description: "Could not initialize map. Please try again later.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const updateMarkerAndCircle = () => {
    if (!mapInstanceRef.current || !location) return;
    
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
          setLocation({ 
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
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const coords = await getCurrentLocation();
      const newLocation = { lat: coords.latitude, lng: coords.longitude };
      setLocation(newLocation);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newLocation);
        mapInstanceRef.current.setZoom(17);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({
        title: "Location Error",
        description: "Could not access your current location. Please check your browser permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map before saving.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaveLoading(true);
      
      // Check if location already exists for this shift
      const { data: existingLocation } = await supabase
        .from('shift_locations')
        .select('id')
        .eq('shift_id', shiftId)
        .single();
      
      let result;
      
      if (existingLocation) {
        // Update existing location
        result = await supabase
          .from('shift_locations')
          .update({
            latitude: location.lat,
            longitude: location.lng,
            radius: radius
          })
          .eq('id', existingLocation.id);
      } else {
        // Insert new location
        result = await supabase
          .from('shift_locations')
          .insert({
            shift_id: shiftId,
            latitude: location.lat,
            longitude: location.lng,
            radius: radius
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Location Saved",
        description: "The check-in location has been set successfully.",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      console.error("Error saving location:", error);
      toast({
        title: "Save Error",
        description: error.message || "Could not save the location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Set Check-in Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-md border border-border"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading && (
            <div className="flex items-center justify-center h-full">
              Loading map...
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <Navigation size={16} />
            Use My Location
          </Button>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Radius:</span>
            <Input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-20 text-right"
              min={50}
              max={1000}
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
        </div>
        
        <Button
          onClick={handleSaveLocation}
          disabled={!location || saveLoading}
          className="w-full"
        >
          {saveLoading ? "Saving..." : (
            <>
              <Save size={16} className="mr-2" />
              Save Location
            </>
          )}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p className="flex items-center mt-2">
            <MapPin size={14} className="mr-1 text-primary" />
            {location ? (
              <span>Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
            ) : (
              <span>Click on the map to select a location</span>
            )}
          </p>
          <p className="text-xs mt-1">
            Promoters will only be able to check in when they're within {radius} meters of this location.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

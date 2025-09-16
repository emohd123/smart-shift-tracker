
// Google Maps type definitions
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      getCenter(): LatLng;
      getZoom(): number;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }
    
    class Marker {
      constructor(opts?: MarkerOptions);
      setPosition(latLng: LatLng | LatLngLiteral): void;
      getPosition(): LatLng;
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: () => void): MapsEventListener;
    }
    
    class Circle {
      constructor(opts?: CircleOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setRadius(radius: number): void;
      setMap(map: Map | null): void;
    }
    
    class NavigationControl {
      constructor(options?: NavigationControlOptions);
    }
    
    class MapsEventListener {
      remove(): void;
    }
    
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      draggable?: boolean;
      animation?: number;
    }
    
    interface CircleOptions {
      center?: LatLng | LatLngLiteral;
      radius?: number;
      map?: Map;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
    }
    
    interface NavigationControlOptions {
      visualizePitch?: boolean;
      position?: number;
    }
    
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface MapMouseEvent {
      latLng?: LatLng;
    }
    
    const Animation: {
      DROP: number;
    };
  }
}

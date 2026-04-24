import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const locationService = {
  /**
   * Request location permissions
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Get current user coordinates
   */
  async getCurrentLocation(): Promise<Coordinates> {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  /**
   * Calculate straight line distance (Air distance) in km
   */
  calculateAirDistance(c1: Coordinates, c2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = (c2.latitude - c1.latitude) * (Math.PI / 180);
    const dLon = (c2.longitude - c1.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(c1.latitude * (Math.PI / 180)) *
        Math.cos(c2.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Get road distance and route from OSRM (FREE)
   */
  async getRoadRoute(
    start: Coordinates, 
    end: Coordinates, 
    mode: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<{ distanceKm: number; durationMin: number; coordinates: Coordinates[] }> {
    try {
      // Use FOSSGIS OSRM server instead of demo server for multi-profile support
      const profileConfigs = {
        'driving': { base: 'routed-car', profile: 'driving' },
        'walking': { base: 'routed-foot', profile: 'walking' },
        'cycling': { base: 'routed-bike', profile: 'cycling' }
      };
      
      const config = profileConfigs[mode] || profileConfigs['driving'];
      const osrmUrl = `https://routing.openstreetmap.de/${config.base}/route/v1/${config.profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      
      console.log('OSRM Request Mode:', mode, 'URL:', osrmUrl);
      
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('Could not fetch route');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        coordinates,
      };
    } catch (error) {
      console.error('OSRM Route Error:', error);
      return {
        distanceKm: this.calculateAirDistance(start, end),
        durationMin: 0,
        coordinates: [start, end],
      };
    }
  },
  /**
   * Watch location changes
   */
  async watchLocation(callback: (loc: Coordinates) => void): Promise<Location.LocationSubscription> {
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    );
  },
};

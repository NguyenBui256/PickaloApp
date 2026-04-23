/**
 * Map Screen Component
 *
 * Main map screen for venue discovery with location-based search,
 * venue markers, clustering, and filter controls.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  AppState,
  AppStateStatus,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import MapWebView, { MapRegion } from '../components/map-webview';
import { mapService } from '../services/map-service';
import { VenueMarker, VenueCluster } from '../types/map';

// Types
interface MapScreenProps {
  navigation: StackNavigationProp<any, any>;
}

interface FilterState {
  venueType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  // State
  const [currentRegion, setCurrentRegion] = useState<MapRegion | null>(null);
  const [venues, setVenues] = useState<VenueMarker[]>([]);
  const [clusters, setClusters] = useState<VenueCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    venueType: null,
    minPrice: null,
    maxPrice: null,
  });

  // Refs
  const webViewRef = useRef<any>(null);
  const fetchingRef = useRef(false);

  // Initial location (Hanoi center)
  const initialCenter = {
    lat: 21.0285,
    lng: 105.8542,
  };

  /**
   * Fetch venues/clusters for current map region
   */
  const fetchVenuesForRegion = useCallback(async (region: MapRegion) => {
    // Prevent duplicate fetches
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);

    try {
      // Decide whether to use clusters based on zoom level
      const useClusters = region.zoom < 13;

      if (useClusters) {
        // Fetch clustered venues
        const clustersData = await mapService.getVenueClusters({
          south: region.south,
          north: region.north,
          west: region.west,
          east: region.east,
          zoom: region.zoom,
          venueType: filters.venueType,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        });

        setClusters(clustersData.clusters);
        setVenues([]); // Clear venues when showing clusters
      } else {
        // Fetch regular venues
        const venuesData = await mapService.getVenuesInBounds({
          south: region.south,
          north: region.north,
          west: region.west,
          east: region.east,
          venueType: filters.venueType,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        });

        setVenues(venuesData.venues);
        setClusters([]); // Clear clusters when showing venues
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filters]);

  /**
   * Handle region change from map
   */
  const handleRegionChange = useCallback((region: MapRegion) => {
    setCurrentRegion(region);
    fetchVenuesForRegion(region);
  }, [fetchVenuesForRegion]);

  /**
   * Handle venue marker press
   */
  const handleVenuePress = useCallback((venueId: string) => {
    navigation.navigate('VenueDetail', { venueId });
  }, [navigation]);

  /**
   * Get user's current location
   */
  const getCurrentLocation = useCallback(() => {
    // In production, use react-native-geolocation-service
    // For now, use default Hanoi location
    setUserLocation(initialCenter);

    // TODO: Implement real geolocation
    // Geolocation.getCurrentPosition(
    //   (position) => {
    //     setUserLocation({
    //       lat: position.coords.latitude,
    //       lng: position.coords.longitude,
    //     });
    //   },
    //   (error) => {
    //     console.error('Error getting location:', error);
    //     setUserLocation(initialCenter);
    //   }
    // );
  }, []);

  /**
   * Pan map to user's location
   */
  const panToUserLocation = useCallback(() => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.panTo(userLocation.lat, userLocation.lng, 14);
    }
  }, [userLocation]);

  /**
   * Update filter
   */
  const updateFilter = useCallback((key: keyof FilterState, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      venueType: null,
      minPrice: null,
      maxPrice: null,
    });
  }, []);

  // Initial setup
  useEffect(() => {
    getCurrentLocation();

    // Initial fetch
    const initialRegion: MapRegion = {
      south: initialCenter.lat - 0.05,
      north: initialCenter.lat + 0.05,
      west: initialCenter.lng - 0.05,
      east: initialCenter.lng + 0.05,
      zoom: 12,
    };

    fetchVenuesForRegion(initialRegion);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh data when app comes to foreground
        if (currentRegion) {
          fetchVenuesForRegion(currentRegion);
        }
      }
    });

    return () => subscription.remove();
  }, [currentRegion, fetchVenuesForRegion]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map WebView */}
      <View style={styles.mapContainer}>
        <MapWebView
          ref={webViewRef}
          initialCenter={initialCenter}
          initialZoom={12}
          venues={venues}
          clusters={clusters}
          onVenuePress={handleVenuePress}
          onRegionChange={handleRegionChange}
          loading={loading}
        />
      </View>

      {/* Filter Controls */}
      {/* TODO: Add filter UI component */}

      {/* User Location Button */}
      {/* TODO: Add floating action button for user location */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
  },
});

export default MapScreen;

/**
 * MapWebView Component
 *
 * Wraps Leaflet map in React Native WebView with bidirectional communication.
 * Handles venue markers, clustering, and region changes.
 */

import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, Platform } from 'react-native';

// Types
interface MapRegion {
  south: number;
  north: number;
  west: number;
  east: number;
  zoom: number;
}

interface VenueMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  venueType: string;
  basePricePerHour: number;
  district: string | null;
  images: string[];
  amenities: string[];
}

interface VenueCluster {
  latitude: number;
  longitude: number;
  count: number;
  venues: VenueMarker[];
}

interface MapWebViewProps {
  initialCenter: {
    lat: number;
    lng: number;
  };
  initialZoom: number;
  venues?: VenueMarker[];
  clusters?: VenueCluster[];
  onVenuePress: (venueId: string) => void;
  onRegionChange: (region: MapRegion) => void;
  loading?: boolean;
}

export const MapWebView: React.FC<MapWebViewProps> = ({
  initialCenter,
  initialZoom,
  venues = [],
  clusters = [],
  onVenuePress,
  onRegionChange,
  loading = false,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Initialize map on mount
  useEffect(() => {
    sendMessage({
      action: 'init',
      centerLat: initialCenter.lat,
      centerLng: initialCenter.lng,
      zoom: initialZoom,
    });
  }, []);

  // Update venues when they change
  useEffect(() => {
    if (venues.length > 0 && clusters.length === 0) {
      sendMessage({
        action: 'displayVenues',
        venues: venues,
      });
    }
  }, [venues, clusters]);

  // Update clusters when they change
  useEffect(() => {
    if (clusters.length > 0) {
      sendMessage({
        action: 'displayClusters',
        clusters: clusters,
      });
    }
  }, [clusters]);

  // Show/hide loading indicator
  useEffect(() => {
    if (loading) {
      sendMessage({ action: 'showLoading' });
    } else {
      sendMessage({ action: 'hideLoading' });
    }
  }, [loading]);

  // Send message to WebView
  const sendMessage = (message: Record<string, unknown>) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(message));
    }
  };

  // Handle messages from WebView
  const handleMapMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'venuePress':
          onVenuePress(data.venueId);
          break;

        case 'regionChange':
          onRegionChange(data.region);
          break;

        case 'mapClick':
          // Map background clicked - could clear selection
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Pan to specific location
  const panTo = (lat: number, lng: number, zoom?: number) => {
    sendMessage({
      action: 'panTo',
      lat,
      lng,
      zoom,
    });
  };

  // Fit map to show all markers
  const fitToMarkers = () => {
    sendMessage({ action: 'fitToMarkers' });
  };

  // Expose methods via ref
  React.useImperativeHandle(
    webViewRef,
    () => ({
      panTo,
      fitToMarkers,
    }),
    []
  );

  // Get correct file path for Android
  const getMapFilePath = () => {
    if (Platform.OS === 'android') {
      return 'file:///android_asset/map.html';
    }
    return './map.html'; // iOS
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: getMapFilePath() }}
      style={styles.webView}
      onMessage={handleMapMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={false}
      scrollEnabled={true}
      bounces={false}
      onError={(error) => console.error('WebView error:', error)}
    />
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default MapWebView;

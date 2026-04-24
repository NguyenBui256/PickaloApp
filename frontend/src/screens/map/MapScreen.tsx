import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenues } from '../../services/venue-service';

const { height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 20.9845,
  longitude: 105.7925,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const MapScreen = () => {
  const navigation = useNavigation<any>();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const params: any = {};
      const res = await fetchVenues(params);
      if (res?.items) {
        setVenues(res.items);
      }
    } catch (error) {
      console.error('Error loading map venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMarkerPress = (venueId: string) => {
    navigation.navigate('MapVenueDetailOverlay', { venueId });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INITIAL_REGION}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.lat || 0,
              longitude: venue.lng || 0,
            }}
            title={venue.name}
            onPress={() => onMarkerPress(venue.id)}
          />
        ))}
      </MapView>

      {/* Search Overlay UI */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchBar}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="alpha-a-box" size={32} color={COLORS.PRIMARY} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sân thể thao..."
            placeholderTextColor={COLORS.GRAY_MEDIUM}
          />
          <TouchableOpacity style={styles.searchIcon}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>

        {/* Categories removed */}
      </View>

      {/* Floating UI: Map Controls */}
      <View style={styles.controlsLeft}>
        <TouchableOpacity style={styles.circularControl}>
          <MaterialCommunityIcons name="layers-outline" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRight}>
        <TouchableOpacity style={styles.circularAction}>
          <MaterialCommunityIcons name="arrow-up" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.circularAction, { marginTop: 12 }]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoContainer: {
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  searchIcon: {
    paddingHorizontal: 10,
  },
  activeChipText: {
    color: COLORS.WHITE,
  },
  controlsLeft: {
    position: 'absolute',
    right: 16,
    top: height * 0.4,
  },
  circularControl: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlsRight: {
    position: 'absolute',
    right: 16,
    bottom: 100,
  },
  circularAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

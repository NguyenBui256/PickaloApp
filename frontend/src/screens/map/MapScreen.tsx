import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { VENUES } from '../../constants/mock-data';
import { fetchVenues, searchVenuesNearby } from '../../services/venue-service'; // TODO: gọi service thay vì VENUES trực tiếp

const { height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 20.9845,
  longitude: 105.7925,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MAP_CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'apps' as const },
  { id: 'pickleball', name: 'Sân Pickleball', icon: 'tennis-ball' as const },
  { id: 'badminton', name: 'Sân Cầu lông', icon: 'badminton' as const },
  { id: 'football', name: 'Sân Bóng đá', icon: 'soccer-field' as const },
];

export const MapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState('all');

  const getMarkerColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pickleball':
        return '#3498DB'; // Blue
      case 'cầu lông':
      case 'badminton':
        return COLORS.PRIMARY; // Green
      case 'bóng đá':
      case 'football':
        return '#27AE60'; // Darker Green
      case 'tennis':
        return '#F39C12'; // Orange
      default:
        return COLORS.ERROR; // Red
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {VENUES.filter(v => activeCategory === 'all' || v.category.toLowerCase().includes(activeCategory.toLowerCase())).map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
            title={venue.name}
            description={venue.address}
            pinColor={getMarkerColor(venue.category)}
            onPress={() => navigation.navigate('MapVenueDetailOverlay', { venueId: venue.id })}
          />
        ))}
      </MapView>

      {/* Floating UI: Search Bar */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchBar}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="alpha-a-box" size={32} color={COLORS.PRIMARY} />
          </View>
          <TextInput
            placeholder="Tìm kiếm sân quanh đây."
            style={styles.searchInput}
            placeholderTextColor={COLORS.GRAY_MEDIUM}
          />
          <TouchableOpacity style={styles.searchIcon}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {MAP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[
                styles.chip,
                activeCategory === cat.id && styles.activeChip,
              ]}
            >
              <MaterialCommunityIcons name={cat.icon as any}
                size={18}
                color={activeCategory === cat.id ? COLORS.WHITE : COLORS.GRAY_MEDIUM}
              />
              <Text
                style={[
                  styles.chipText,
                  activeCategory === cat.id && styles.activeChipText,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  chipsScroll: {
    marginTop: 15,
  },
  chipsContainer: {
    paddingRight: 20,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  activeChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '600',
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
});

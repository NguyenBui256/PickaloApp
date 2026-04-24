import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  FlatList,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { searchAddress, SearchResult } from '../../../services/map-service';
import { useNavigation, useRoute } from '@react-navigation/native';

const INITIAL_REGION: Region = {
  latitude: 21.028511, // Hanoi center
  longitude: 105.804817,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const VenueLocationPickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { onLocationSelected, initialLocation } = route.params || {};

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(initialLocation ? {
    ...INITIAL_REGION,
    latitude: initialLocation.lat,
    longitude: initialLocation.lng,
  } : INITIAL_REGION);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: initialLocation?.lat || INITIAL_REGION.latitude,
    lng: initialLocation?.lng || INITIAL_REGION.longitude,
    address: initialLocation?.address || '',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    Keyboard.dismiss();
    const results = await searchAddress(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  const selectSearchResult = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    const newRegion = {
      ...region,
      latitude: lat,
      longitude: lng,
    };
    
    setRegion(newRegion);
    setSelectedLocation({
      lat,
      lng,
      address: item.display_name,
    });
    
    mapRef.current?.animateToRegion(newRegion, 1000);
    setSearchResults([]);
    setSearchQuery('');
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    setSelectedLocation(prev => ({
      ...prev,
      lat: newRegion.latitude,
      lng: newRegion.longitude,
    }));
  };

  const handleConfirm = () => {
    if (onLocationSelected) {
      onLocationSelected({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: selectedLocation.address,
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
      <View style={styles.searchContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Chọn vị trí sân</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtnTop}>
            <Text style={styles.confirmTextTop}>Xác nhận</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.GRAY_MEDIUM} style={styles.searchIcon} />
          <TextInput
            placeholder="Tìm địa chỉ, tên đường..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} style={styles.searchIcon} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.GRAY_MEDIUM} style={styles.searchIcon} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search Results Overlay */}
      {searchResults.length > 0 && (
        <View style={styles.resultsOverlay}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => selectSearchResult(item)}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.GRAY_MEDIUM} />
                <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
            style={styles.resultsList}
          />
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
        />
        
        {/* Fixed Marker in Center */}
        <View style={styles.markerFixed} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={40} color={COLORS.ERROR} />
          <View style={styles.markerShadow} />
        </View>

        {/* Current Coordinates Display */}
        <View style={styles.coordDisplay}>
          <Text style={styles.coordText}>
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>XÁC NHẬN VỊ TRÍ NÀY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: COLORS.WHITE,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backBtn: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmBtnTop: {
    padding: 5,
  },
  confirmTextTop: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: {
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  resultsOverlay: {
    position: 'absolute',
    top: 120,
    left: 15,
    right: 15,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    maxHeight: 300,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsList: {
    padding: 5,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    gap: 10,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -2,
  },
  coordDisplay: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coordText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmBtn: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

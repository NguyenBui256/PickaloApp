import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import COLORS from '@theme/colors';

type LocationPickerRouteProp = RouteProp<{ LocationPicker: { initialLocation?: { lat: number; lng: number } } }, 'LocationPicker'>;

const INITIAL_REGION: Region = {
  latitude: 20.9845,
  longitude: 105.7925,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const LocationPickerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<LocationPickerRouteProp>();
  const initialLocation = route.params?.initialLocation;

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(
    initialLocation
      ? { latitude: initialLocation.lat, longitude: initialLocation.lng }
      : { latitude: INITIAL_REGION.latitude, longitude: INITIAL_REGION.longitude }
  );

  const [region, setRegion] = useState<Region>(
    initialLocation
      ? {
          latitude: initialLocation.lat,
          longitude: initialLocation.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : INITIAL_REGION
  );

  const handleConfirmLocation = () => {
    navigation.navigate('VenueRegistration', {
      selectedLocation: {
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      },
    });
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setRegion({
      ...region,
      latitude,
      longitude,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.headerTitle}>Chọn vị trí trên bản đồ</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ latitude, longitude });
          }}
        >
          <View style={styles.markerContainer}>
            <MaterialCommunityIcons name="map-marker-radius" size={40} color={COLORS.PRIMARY} />
            <View style={styles.markerDot} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.infoLabel}>Vĩ độ:</Text>
          <Text style={styles.infoValue}>{selectedLocation.latitude.toFixed(6)}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.infoLabel}>Kinh độ:</Text>
          <Text style={styles.infoValue}>{selectedLocation.longitude.toFixed(6)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmLocation}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.WHITE} />
          <Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: COLORS.WHITE,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    marginTop: -5,
  },
  infoCard: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
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
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenues } from '../../services/venue-service';
import { locationService, Coordinates } from '../../services/location-service';

const { height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 20.9845,
  longitude: 105.7925,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const MapScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { destination, showRoute, targetVenueId } = route.params || {};

  const [activeCategory, setActiveCategory] = useState('all');
  const [venues, setVenues] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');

  const clearRoute = () => {
    setRouteCoords([]);
    setRouteInfo(null);
    navigation.setParams({ showRoute: false, destination: null });
  };

  useEffect(() => {
    console.log('MapScreen: Nav Params:', { showRoute, destination, targetVenueId });
    
    fetchVenues().then(res => {
      if (res?.items) {
        setVenues(res.items);
      }
    }).catch(err => {
      console.error('MapScreen: Error fetching venues:', err);
    });

    // START REAL-TIME LOCATION WATCHING
    let locationSubscription: any = null;
    
    const startWatching = async () => {
      const hasPermission = await locationService.requestPermission();
      if (hasPermission) {
        locationSubscription = await locationService.watchLocation((loc) => {
          console.log('MapScreen: Real-time Location Update:', loc);
          setUserLocation(loc);
        });
      }
    };

    startWatching();

    // CLEANUP on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
        console.log('MapScreen: Location watcher stopped');
      }
    };
  }, [showRoute, destination, targetVenueId]);

  useEffect(() => {
    if (showRoute && destination && userLocation) {
      console.log('MapScreen: Fetching road route from', userLocation, 'to', destination, 'mode:', travelMode);
      locationService.getRoadRoute(userLocation, destination, travelMode)
        .then(res => {
          console.log('MapScreen: Route obtained, points:', res.coordinates.length);
          setRouteCoords(res.coordinates);
          setRouteInfo({
            distance: res.distanceKm < 1 
              ? `${(res.distanceKm * 1000).toFixed(0)}m` 
              : `${res.distanceKm.toFixed(1)}km`,
            duration: `${Math.ceil(res.durationMin)} phút`
          });
        })
        .catch(err => console.error('Routing error:', err));
    } else {
      if (!showRoute) {
        setRouteCoords([]);
        setRouteInfo(null);
      }
    }
  }, [showRoute, destination, userLocation, travelMode]);

  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeCoords]);

  const getMarkerColor = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('pickleball')) return '#3498DB';
    if (cat.includes('badminton') || cat.includes('cầu lông')) return COLORS.PRIMARY;
    if (cat.includes('football') || cat.includes('bóng đá')) return '#27AE60';
    if (cat.includes('tennis')) return '#F39C12';
    return COLORS.ERROR;
  };

  const onMarkerPress = (venueId: string) => {
    navigation.navigate('MapVenueDetailOverlay', { venueId });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
      >
        {venues
          .map((venue) => {
            // Safety check for location
            if (!venue.location || typeof venue.location.lat !== 'number' || typeof venue.location.lng !== 'number') {
              return null;
            }
            
            return (
              <Marker
                key={venue.id}
                coordinate={{ latitude: venue.location.lat, longitude: venue.location.lng }}
                title={venue.name}
                description={venue.address || ''}
                pinColor={getMarkerColor(venue.category || venue.venue_type)}
                onPress={() => navigation.navigate('MapVenueDetailOverlay', { venueId: venue.id })}
              />
            );
          })}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#3498DB"
            lineDashPattern={[0]}
          />
        )}
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

      {/* Floating UI: Route Info Overlay */}
      {routeInfo && (
        <View style={styles.routeInfoOverlay}>
          <View style={styles.modeSelectorBar}>
            <TouchableOpacity 
              style={[styles.modeBtn, travelMode === 'driving' && styles.modeBtnActive]} 
              onPress={() => setTravelMode('driving')}
            >
              <MaterialCommunityIcons 
                name="car" 
                size={22} 
                color={travelMode === 'driving' ? COLORS.WHITE : COLORS.GRAY_MEDIUM} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeBtn, travelMode === 'walking' && styles.modeBtnActive]} 
              onPress={() => setTravelMode('walking')}
            >
              <MaterialCommunityIcons 
                name="walk" 
                size={22} 
                color={travelMode === 'walking' ? COLORS.WHITE : COLORS.GRAY_MEDIUM} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeBtn, travelMode === 'cycling' && styles.modeBtnActive]} 
              onPress={() => setTravelMode('cycling')}
            >
              <MaterialCommunityIcons 
                name="bicycle" 
                size={22} 
                color={travelMode === 'cycling' ? COLORS.WHITE : COLORS.GRAY_MEDIUM} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routeIcon}>
              <MaterialCommunityIcons name="navigation" size={28} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeDistance}>{routeInfo.distance}</Text>
              <Text style={styles.routeDuration}>{routeInfo.duration}</Text>
            </View>
            <TouchableOpacity style={styles.closeRouteBtn} onPress={clearRoute}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.GRAY_MEDIUM} />
            </TouchableOpacity>
          </View>
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
  routeInfoOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  modeSelectorBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modeBtn: {
    width: 44,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  modeBtnActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
    width: '60%',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeDetails: {
    flex: 1,
    marginLeft: 15,
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  routeDuration: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: 2,
  },
  closeRouteBtn: {
    padding: 8,
  },
});

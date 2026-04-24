import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenues } from '../../services/venue-service';
import { locationService, Coordinates } from '../../services/location-service';
import { matchService } from '../../services/match-service';
import { MatchResponse } from '../../types/api-types';
import { MatchDetailModal } from '../match/MatchDetailModal';
import { MatchFilterModal } from '../match/MatchFilterModal';

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
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [mapMode, setMapMode] = useState<'venue' | 'match'>('venue');
  const [selectedMatch, setSelectedMatch] = useState<MatchResponse | null>(null);
  const [selectedMatchGroup, setSelectedMatchGroup] = useState<MatchResponse[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ 
    skillLevel: 'ALL', 
    members: null,
    date: null,
    startTime: null,
    endTime: null,
    radiusKm: null as number | null,
  });

  const clearRoute = () => {
    setRouteCoords([]);
    setRouteInfo(null);
    navigation.setParams({ showRoute: false, destination: null });
  };

  const fetchNearbyMatches = async () => {
    try {
      const res = await matchService.searchNearbyMatches({
        lat: userLocation?.latitude || INITIAL_REGION.latitude,
        lng: userLocation?.longitude || INITIAL_REGION.longitude,
        radius: 10000,
        skill_level: filters.skillLevel === 'ALL' ? undefined : filters.skillLevel as any,
        min_slots: filters.members ? parseInt(filters.members) : undefined,
        date: filters.date || undefined,
        start_time: filters.startTime || undefined,
        end_time: filters.endTime || undefined,
      });
      setMatches(res);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  useEffect(() => {
    console.log('MapScreen: Nav Params:', { showRoute, destination, targetVenueId });
    
    if (mapMode === 'venue') {
      fetchVenues().then(res => {
        if (res?.items) {
          setVenues(res.items);
        }
      }).catch(err => {
        console.error('MapScreen: Error fetching venues:', err);
      });
    } else {
      fetchNearbyMatches();
    }

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
  }, [showRoute, destination, targetVenueId, mapMode]);

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

  const groupedMatches = useMemo(() => {
    const groups: Record<string, any[]> = {};
    matches.forEach(m => {
      const key = m.venue_id || (m.location ? `${m.location.lat},${m.location.lng}` : 'unknown');
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.values(groups);
  }, [matches]);

  // Filter groups by radius if set
  const filteredGroupedMatches = useMemo(() => {
    if (!filters.radiusKm || !userLocation) return groupedMatches;
    const radiusM = filters.radiusKm * 1000;
    return groupedMatches.filter(group => {
      const m = group[0];
      if (!m.location) return false;
      // Haversine distance in meters
      const R = 6371000;
      const lat1 = userLocation.latitude * Math.PI / 180;
      const lat2 = m.location.lat * Math.PI / 180;
      const dLat = (m.location.lat - userLocation.latitude) * Math.PI / 180;
      const dLng = (m.location.lng - userLocation.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return dist <= radiusM;
    });
  }, [groupedMatches, filters.radiusKm, userLocation]);

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
        {mapMode === 'venue' ? (
          venues.map((venue) => {
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
          })
        ) : (
          filteredGroupedMatches.map((group) => {
            const firstMatch = group[0];
            const isGroup = group.length > 1;
            
            if (!firstMatch.location || typeof firstMatch.location.lat !== 'number' || typeof firstMatch.location.lng !== 'number') {
              return null;
            }
            return (
              <Marker
                key={isGroup ? `group-${firstMatch.venue_id}` : firstMatch.id}
                coordinate={{ latitude: firstMatch.location.lat, longitude: firstMatch.location.lng }}
                onPress={() => {
                  if (isGroup) {
                    setSelectedMatchGroup(group);
                  } else {
                    setSelectedMatch(firstMatch);
                  }
                }}
              >
                <View style={[styles.markerContainer, { backgroundColor: isGroup ? '#E74C3C' : '#FF8C00' }]}>
                  <View style={[styles.markerBadge, { backgroundColor: isGroup ? '#E74C3C' : '#FF8C00' }]}>
                    <Text style={{color: COLORS.WHITE, fontWeight: 'bold', fontSize: 12}}>
                      {group.length}
                    </Text>
                  </View>
                  <View style={[styles.markerArrow, { borderTopColor: isGroup ? '#E74C3C' : '#FF8C00' }]} />
                  {isGroup && (
                    <View style={styles.groupIndicator}>
                      <MaterialCommunityIcons name="layers-outline" size={10} color={COLORS.WHITE} />
                    </View>
                  )}
                </View>
              </Marker>
            );
          })
        )}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#3498DB"
            lineDashPattern={[0]}
          />
        )}

        {/* Radius Circle (Search Area) */}
        {filters.radiusKm && userLocation && (
          <Circle
            center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            radius={filters.radiusKm * 1000}
            strokeColor="rgba(59,130,246,0.9)"
            strokeWidth={3}
            fillColor="rgba(59,130,246,0.08)"
          />
        )}
      </MapView>

      {/* Header Area with Search & Mode Toggle */}
      <View style={styles.headerArea}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.GRAY_MEDIUM} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khu vực sân..."
            placeholderTextColor={COLORS.GRAY_MEDIUM}
          />
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons name="tune" size={22} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* --- MAP MODE TOGGLE --- */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, mapMode === 'venue' && styles.toggleBtnActive]}
            onPress={() => setMapMode('venue')}
          >
            <Text style={[styles.toggleText, mapMode === 'venue' && styles.toggleTextActive]}>Tìm sân</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, mapMode === 'match' && styles.toggleBtnActive]}
            onPress={() => setMapMode('match')}
          >
            <Text style={[styles.toggleText, mapMode === 'match' && styles.toggleTextActive]}>Ghép kèo</Text>
          </TouchableOpacity>
        </View>
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

      <MatchDetailModal 
        visible={!!selectedMatch}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

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

      <MatchDetailModal 
        visible={!!selectedMatch || !!selectedMatchGroup}
        match={selectedMatch}
        matches={selectedMatchGroup || undefined}
        onClose={() => {
          setSelectedMatch(null);
          setSelectedMatchGroup(null);
        }}
      />

      <MatchFilterModal 
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          // Here we would refetch matches, for now logic is handled in fetchNearbyMatches
          fetchNearbyMatches(); 
        }}
      />
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
  headerArea: {
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
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  filterBtn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 8,
    borderRadius: 20,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 25,
    padding: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toggleBtnActive: {
    backgroundColor: '#FF8C00',
  },
  toggleText: {
    color: COLORS.GRAY_MEDIUM,
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleTextActive: {
    color: COLORS.WHITE,
  },
  chipsScroll: {
    marginTop: 15,
    position: 'absolute',
    top: 160,
    left: 20,
    zIndex: 10,
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  markerBadge: {
    backgroundColor: COLORS.PRIMARY,
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.PRIMARY,
    marginTop: -2,
  },
  groupIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#C0392B',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.WHITE,
  },
});

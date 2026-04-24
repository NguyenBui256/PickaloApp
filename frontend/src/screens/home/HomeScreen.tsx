
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import COLORS from '@theme/colors';
import { VenueCard } from '../../components/VenueCard';
import { BookingModal } from '../../components/BookingModal';
import { QUICK_FILTERS } from '../../constants/mock-data';
import { fetchVenues } from '../../services/venue-service';
import { toggleFavorite } from '../../services/favorite-service';
import { useAuthStore } from '../../store/auth-store';
import { locationService, Coordinates } from '../../services/location-service';
import { Alert } from 'react-native';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const user = useAuthStore(state => state.user);
  const [venues, setVenues] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('Tất cả');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVenues();
  }, [activeQuickFilter]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (activeQuickFilter === 'Bãi đỗ xe') params.has_parking = true;
      if (activeQuickFilter === 'Có đèn') params.has_lights = true;

      const res = await fetchVenues(params);
      if (res?.items) {
        setVenues(res.items);
        // If we already have location, calculate distances immediately
        const loc = currentLoc || userLocation;
        if (loc) {
          calculateDistances(res.items, loc);
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const calculateDistances = (items: any[], loc: Coordinates) => {
    const updatedItems = items.map(venue => {
      if (venue.location) {
        const dist = locationService.calculateAirDistance(loc, {
          latitude: venue.location.lat,
          longitude: venue.location.lng,
        });
        return { ...venue, distance: `${dist.toFixed(1)} km` };
      }
      return venue;
    });

    // If quick filter is "Gần nhất", sort
    if (activeQuickFilter === 'Gần nhất') {
      updatedItems.sort((a, b) => {
        const dA = parseFloat(a.distance || '999');
        const dB = parseFloat(b.distance || '999');
        return dA - dB;
      });
    }

    setVenues(updatedItems);
  };

  useEffect(() => {
    // 1. Load venues immediately (Fast)
    loadVenues();

    // 2. Then get location (Slower hardware call)
    const initLocation = async () => {
      const hasPermission = await locationService.requestPermission();
      if (hasPermission) {
        try {
          const loc = await locationService.getCurrentLocation();
          setUserLocation(loc);
        } catch (err) {
          console.log('Location error:', err);
        }
      }
    };

    initLocation();
  }, []);

  // Update distances whenever location or venues or filters change
  useEffect(() => {
    if (userLocation && venues.length > 0 && !venues[0].distance) {
      calculateDistances(venues, userLocation);
    }
  }, [userLocation, activeQuickFilter]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh location too
    try {
      const loc = await locationService.getCurrentLocation();
      setUserLocation(loc);
      await loadVenues(loc);
    } catch (err) {
      await loadVenues();
    }
    setRefreshing(false);
  }, [userLocation]);

  const handleToggleFavorite = async (id: string) => {
    if (!user) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu sân yêu thích');
      return;
    }

    try {
      const res = await toggleFavorite(id);
      // Update local state for immediate feedback
      setVenues(prev => prev.map(v => v.id === id ? { ...v, is_favorite: res.is_favorite } : v));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích');
    }
  };

  const handleBookPress = (venueId: string) => {
    setSelectedVenueId(venueId);
    setBookingModalVisible(true);
  };

  const handleSelectBookingOption = (type: 'normal' | 'event') => {
    setBookingModalVisible(false);
    // Navigate to actual booking screen based on type
    navigation.navigate('BookingDetails', { venueId: selectedVenueId, type });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // Keep search bar sticky or semi-sticky if desired
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]} // Android
            tintColor={COLORS.PRIMARY} // iOS
          />
        }
      >
        {/* Header Section */}
        <LinearGradient colors={COLORS.GRADIENT_GREEN} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('Profile')}
              >
                <View style={styles.logoContainer}>
                  <MaterialCommunityIcons name="alpha-a-box" size={32} color={COLORS.WHITE} />
                </View>
                <View style={styles.textInfo}>
                  <Text style={styles.dateText}>Thứ hai, 06/04/2026</Text>
                  <Text style={styles.userName}>{user?.full_name || 'Người dùng'}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.notificationBtn}>
                  <MaterialCommunityIcons name="bell-outline" size={26} color={COLORS.WHITE} />
                  <View style={styles.flagBadge}>
                    <Text style={styles.flagEmoji}>🇻🇳</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Silhouettes simulation */}
            <View style={styles.silhouettes}>
              <MaterialCommunityIcons name="run-fast" size={80} color="rgba(255,255,255,0.1)" style={styles.silIcon1} />
              <MaterialCommunityIcons name="tennis" size={60} color="rgba(255,255,255,0.1)" style={styles.silIcon2} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Search & Quick Filters Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={24} color={COLORS.GRAY_MEDIUM} />
              <TextInput
                placeholder="Tìm kiếm"
                style={styles.searchInput}
                placeholderTextColor={COLORS.GRAY_MEDIUM}
                onFocus={() => navigation.navigate('Search')}
              />
              <TouchableOpacity>
                <MaterialCommunityIcons name="qrcode-scan" size={22} color={COLORS.GRAY_MEDIUM} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.favFloatingBtn}
              onPress={() => navigation.navigate('Favorites')}
            >
              <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFilters}
          >
            {QUICK_FILTERS.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterPill,
                  activeQuickFilter === filter && { backgroundColor: COLORS.PRIMARY }
                ]}
                onPress={() => setActiveQuickFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  activeQuickFilter === filter && { color: COLORS.WHITE }
                ]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>
          {/* Categories Section */}
          {/* Categories Section removed */}

          {/* Venue List */}
          <View style={styles.venueList}>
            {venues.map((venue) => (
              <VenueCard
                key={venue.id}
                {...venue}
                is_favorite={venue.is_favorite}
                onFavoriteToggle={() => handleToggleFavorite(venue.id)}
                onBook={() => handleBookPress(venue.id)}
                onPress={() => navigation.navigate('VenueDetails', { venueId: venue.id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BookingModal
        isVisible={isBookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        onSelectOption={handleSelectBookingOption}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInfo: {
    marginLeft: 12,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerActions: {
    flexDirection: 'row',
  },
  notificationBtn: {
    padding: 8,
  },
  flagBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    padding: 1,
  },
  flagEmoji: {
    fontSize: 10,
  },
  silhouettes: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    flexDirection: 'row',
  },
  silIcon1: {
    transform: [{ rotate: '15deg' }],
  },
  silIcon2: {
    marginLeft: -20,
    marginTop: 20,
  },
  searchSection: {
    marginTop: -25,
    paddingHorizontal: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  favFloatingBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quickFilters: {
    paddingVertical: 15,
    gap: 12,
  },
  filterPill: {
    backgroundColor: 'rgba(224, 224, 224, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 20,
  },
  filterBanner: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  venueList: {
    paddingBottom: 20,
  },
});

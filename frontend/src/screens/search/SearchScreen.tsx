import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenues } from '../../services/venue-service';
import { toggleFavorite } from '../../services/favorite-service';
import { VenueCard } from '../../components/VenueCard';
import { useAuthStore } from '../../store/auth-store';
import { Alert } from 'react-native';

import { locationService, Coordinates } from '../../services/location-service';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);

  const loadVenues = async (currentLoc?: Coordinates | null) => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeType) params.venue_type = activeType;

      const res = await fetchVenues(params);
      if (res?.items) {
        let filtered = res.items;

        // Frontend search filter if BE doesn't support it yet
        if (searchQuery) {
          filtered = filtered.filter(v =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.address || '').toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Calculate distances if location is available
        const loc = currentLoc || userLocation;
        if (loc) {
          filtered = filtered.map(v => {
            if (v.location) {
              const dist = locationService.calculateAirDistance(loc, {
                latitude: v.location.lat,
                longitude: v.location.lng
              });
              return { ...v, distance: `${dist.toFixed(1)} km` };
            }
            return v;
          });
        }

        setVenues(filtered);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial location and data fetch
  useEffect(() => {
    const init = async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        setUserLocation(loc);
        await loadVenues(loc);
      } catch (err) {
        console.log('Location error:', err);
        await loadVenues();
      }
    };
    init();
  }, [user]);

  // Debounced search when query or type changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadVenues();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeType]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setUserLocation(loc);
      await loadVenues(loc);
    } catch (err) {
      await loadVenues();
    }
    setRefreshing(false);
  }, [userLocation, searchQuery, activeType]);

  const handleToggleFavorite = async (id: string) => {
    if (!user) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu sân yêu thích');
      return;
    }

    try {
      const res = await toggleFavorite(id);
      setVenues(prev => prev.map(v => v.id === id ? { ...v, is_favorite: res.is_favorite } : v));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.GRAY_MEDIUM} />
            <TextInput
              autoFocus
              placeholder="Tìm kiếm sân, địa chỉ, môn thể thao..."
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.GRAY_MEDIUM} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={venues}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <VenueCard
              {...item}
              is_favorite={item.is_favorite}
              onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
              onBook={() => navigation.navigate('VenueDetails', { venueId: item.id })}
              onFavoriteToggle={() => handleToggleFavorite(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="magnify-close" size={80} color={COLORS.GRAY_LIGHT} />
              <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  activeFilterChip: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: COLORS.WHITE,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 20,
  },
});

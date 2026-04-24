import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchFavoriteVenues, toggleFavorite } from '../../services/favorite-service';
import { VenueCard } from '../../components/VenueCard';
import { VenueListItem } from '../../types/api-types';
import { useAuthStore } from '../../store/auth-store';

import { locationService, Coordinates } from '../../services/location-service';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async (currentLoc?: Coordinates | null) => {
    try {
      const res = await fetchFavoriteVenues();
      if (res?.items) {
        setVenues(res.items);
        const loc = currentLoc || userLocation;
        if (loc) {
          calculateDistances(res.items, loc);
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateDistances = (items: VenueListItem[], loc: Coordinates) => {
    const updatedItems = items.map(v => {
      if (v.location) {
        const dist = locationService.calculateAirDistance(loc, {
          latitude: v.location.lat,
          longitude: v.location.lng
        });
        return { ...v, distance: `${dist.toFixed(1)} km` };
      }
      return v;
    });
    setVenues(updatedItems);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites(); // Fast load

      const init = async () => {
        try {
          const loc = await locationService.getCurrentLocation();
          setUserLocation(loc);
        } catch (err) {
          console.log('Location error:', err);
        }
      };
      init();
    }, [])
  );

  useEffect(() => {
    if (userLocation && venues.length > 0 && !venues.some(v => v.distance)) {
      calculateDistances(venues, userLocation);
    }
  }, [userLocation]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await toggleFavorite(id);
      if (!res.is_favorite) {
        // Remove from list if un-favorited
        setVenues(prev => prev.filter(v => v.id !== id));
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const loc = await locationService.getCurrentLocation();
      setUserLocation(loc);
      await loadFavorites(loc);
    } catch (err) {
      await loadFavorites();
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="heart-broken" size={80} color={COLORS.GRAY_LIGHT} />
        <Text style={styles.emptyText}>Vui lòng đăng nhập để xem sân yêu thích</Text>
        <TouchableOpacity 
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sân yêu thích</Text>
          <View style={{ width: 32 }} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={venues}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <VenueCard
                {...item}
                is_favorite={true}
                onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
                onBook={() => navigation.navigate('VenueDetails', { venueId: item.id })}
                onFavoriteToggle={() => handleToggleFavorite(item.id)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="heart-outline" size={80} color={COLORS.GRAY_LIGHT} />
                <Text style={styles.emptyText}>Bạn chưa có sân yêu thích nào</Text>
                <TouchableOpacity 
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 20,
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginBtnText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

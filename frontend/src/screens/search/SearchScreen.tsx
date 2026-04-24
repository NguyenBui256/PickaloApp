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
import { VenueCard } from '../../components/VenueCard';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadVenues();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeType]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeType) params.venue_type = activeType;
      // Note: If backend doesn't support 'q' or 'name' search yet, 
      // we still fetch and can filter on frontend or use district
      const res = await fetchVenues(params);
      if (res?.items) {
        let filtered = res.items;
        if (searchQuery) {
          filtered = filtered.filter(v =>
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.address || '').toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setVenues(filtered);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
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
          renderItem={({ item }) => (
            <VenueCard
              {...item}
              onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
              onBook={() => navigation.navigate('VenueDetails', { venueId: item.id })}
              onFavoriteToggle={() => { }}
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

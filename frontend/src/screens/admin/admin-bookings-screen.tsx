/**
 * Admin Bookings Screen - Booking oversight and management.
 * Phase 3: Placeholder implementation.
 * Full implementation in Phase 5.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { AdminNavigationProp } from '@navigation/AdminNavigator';
import { getAdminBookings } from '@services/admin-service';
import type { BookingListItem } from '@types/api-types';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '@theme/colors';

interface AdminBookingsScreenProps {
  navigation: AdminNavigationProp;
}

export function AdminBookingsScreen({ navigation }: AdminBookingsScreenProps): React.JSX.Element {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchBookings = async () => {
    try {
      const response = await getAdminBookings({ status: statusFilter });
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const renderBookingItem = ({ item }: { item: BookingListItem }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => navigation.navigate('AdminBookingDetail' as any, { bookingId: item.id } as any)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.venueName}>{item.venue_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={14} color="#6C757D" />
          <Text style={styles.detailText}>{item.user_name || 'Khách hàng'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color="#6C757D" />
          <Text style={styles.detailText}>{item.booking_date} | {item.start_time} - {item.end_time}</Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.priceText}>{(item.total_price || 0).toLocaleString()} VND</Text>
        <Ionicons name="chevron-forward" size={16} color="#ADB5BD" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Oversight</Text>
        <Text style={styles.subtitle}>View and manage all platform bookings</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <FilterChip label="All" active={statusFilter === undefined} onPress={() => setStatusFilter(undefined)} />
          <FilterChip label="Confirmed" active={statusFilter === 'CONFIRMED'} onPress={() => setStatusFilter('CONFIRMED')} />
          <FilterChip label="Pending" active={statusFilter === 'PENDING'} onPress={() => setStatusFilter('PENDING')} />
          <FilterChip label="Cancelled" active={statusFilter === 'CANCELLED'} onPress={() => setStatusFilter('CANCELLED')} />
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066CC" />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchBookings();
          }}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#DEE2E6" />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CONFIRMED': return '#28A745';
    case 'PENDING': return '#FD7E14';
    case 'CANCELLED': return '#DC3545';
    case 'COMPLETED': return '#0066CC';
    default: return '#6C757D';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0066CC',
  },
  filterChipText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookingDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#495057',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0066CC',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#ADB5BD',
    fontSize: 16,
    marginTop: 12,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import COLORS from '@theme/colors';
import {
  fetchMerchantBookings,
  approveBooking,
  rejectBooking,
} from '../../../services/merchant-service';
import type { BookingListItem } from '../../../types/api-types';
import { formatCurrency } from '../../../utils/format';

export const ScheduleManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'maintenance'>('pending');
  const [_loading, setLoading] = useState(true);

  const loadBookings = () => {
    setLoading(true);
    fetchMerchantBookings()
      .then((res) => {
        setBookings(res.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      loadBookings();
    }, [])
  );

  const filteredRequests = bookings.filter((b) => {
    const status = b.status.toUpperCase();
    if (activeTab === 'pending') return status === 'PENDING';
    if (activeTab === 'approved') return status === 'CONFIRMED' || status === 'COMPLETED';
    return false;
  });

  const handleAction = (id: string, action: 'APPROVE' | 'CANCEL') => {
    const actionText = action === 'APPROVE' ? 'duyệt' : 'hủy';
    Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} đơn đặt sân này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            if (action === 'CANCEL') {
              await rejectBooking(id, { reason: 'Merchant rejected' });
            } else {
              await approveBooking(id);
            }
            // Refresh list immediately from the source
            loadBookings();
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể thực hiện thao tác.');
          }
        },
      },
    ]);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'CONFIRMED': return 'Đã duyệt';
      case 'CANCELLED': return 'Đã hủy';
      case 'COMPLETED': return 'Hoàn thành';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F57C00';
      case 'CONFIRMED': return '#388E3C';
      case 'CANCELLED': return '#D32F2F';
      case 'COMPLETED': return '#1976D2';
      default: return '#666';
    }
  };

  const renderItem = ({ item }: { item: BookingListItem }) => (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer_name || 'Khách hàng'}</Text>
          <Text style={styles.customerPhone}>{item.customer_phone || 'Chưa cập nhật SĐT'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="calendar" size={18} color="#666" />
          <Text style={styles.detailText}>{item.booking_date}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="clock-outline" size={18} color="#666" />
          <Text style={styles.detailText}>
            {item.start_time} - {item.end_time}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="tennis" size={18} color="#666" />
          <Text style={styles.detailText}>{item.court_name || 'N/A'}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="cash" size={18} color="#666" />
          <Text style={styles.detailText}>
            {formatCurrency(item.total_price)}
          </Text>
        </View>
      </View>

      {item.status === 'PENDING' ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => handleAction(item.id, 'CANCEL')}
          >
            <Text style={styles.cancelBtnText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            onPress={() => handleAction(item.id, 'APPROVE')}
          >
            <Text style={styles.approveBtnText}>Duyệt đơn</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={() => navigation.navigate('OwnerBookingDetail', { bookingId: item.id })}
      >
        <Text style={styles.detailsBtnText}>Xem chi tiết</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý lịch đặt</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialCommunityIcons name="tune" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Đang chờ ({bookings.filter((b) => b.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
            Đã duyệt ({bookings.filter((b) => b.status === 'CONFIRMED').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'maintenance' && styles.activeTab]}
          onPress={() => setActiveTab('maintenance')}
        >
          <Text style={[styles.tabText, activeTab === 'maintenance' && styles.activeTabText]}>
            Bảo trì
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color="#DDD" />
            <Text style={styles.emptyText}>Không có yêu cầu nào đang chờ</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterBtn: {
    padding: 5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#1976D2',
  },
  listContent: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
  },
  servicesContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 15,
  },
  servicesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  servicesList: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  approveBtn: {
    backgroundColor: '#1976D2',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 15,
  },
  detailsBtn: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    alignItems: 'center',
  },
  detailsBtnText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

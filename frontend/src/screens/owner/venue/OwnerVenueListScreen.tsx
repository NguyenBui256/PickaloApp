import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { OWNER_VENUES } from '../../../constants/mock-data';
import { fetchMyVenues } from '../../../services/merchant-service'; // TODO: gọi service thay vì OWNER_VENUES trực tiếp

export const OwnerVenueListScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const renderVenue = ({ item }: { item: typeof OWNER_VENUES[0] }) => (
    <View style={styles.venueCard}>
      <View style={styles.venueHeader}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            {item.status === 'ACTIVE' && <MaterialCommunityIcons name="star" size={16} color="#FFC107" />}
            {item.status === 'ACTIVE' && <Text style={styles.ratingText}>{item.rating}</Text>}
            <Text style={[styles.statusBadge, item.status === 'PENDING' && styles.statusBadgePending]}>
              {item.status === 'PENDING' ? 'ĐANG ĐỢI DUYỆT' : 'HOẠT ĐỘNG'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Doanh thu / tháng</Text>
          <Text style={styles.statValue}>{(item.revenue_mtd).toLocaleString('vi-VN')} đ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Lượt đặt</Text>
          <Text style={styles.statValue}>{item.total_bookings}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.maintenanceBtn, item.status === 'PENDING' && styles.disabledBtn ]}
          disabled={item.status === 'PENDING'}
          onPress={() => navigation.navigate('MaintenanceScheduler', { venueId: item.id })}
        >
          <MaterialCommunityIcons name="wrench-clock" size={20} color={COLORS.WHITE} />
          <Text style={styles.maintenanceText}>Thiết lập bảo trì</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]}>
          <MaterialCommunityIcons name="pencil" size={20} color="#1976D2" />
          <Text style={styles.editText}>Sửa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sân của tôi</Text>
      </View>

      <FlatList
        data={OWNER_VENUES}
        renderItem={renderVenue}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="storefront-outline" size={60} color="#DDD" />
            <Text style={styles.emptyText}>Bạn chưa có sân nào.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('VenueRegistration')}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.WHITE} />
        <Text style={styles.fabText}>Đăng ký sân mới</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 15,
    paddingBottom: 100, // Space for FAB
  },
  venueCard: {
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
  venueHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginRight: 10,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#388E3C',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgePending: {
    color: '#F57C00',
    backgroundColor: '#FFF3E0',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  maintenanceBtn: {
    flex: 2,
    backgroundColor: '#FF9800',
  },
  maintenanceText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  editText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 5,
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
  disabledBtn: {
    backgroundColor: '#BDBDBD',
  },
});

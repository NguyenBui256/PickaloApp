import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { getAdminVenues, verifyVenue, updateVenueStatus } from '../../../services/admin-service';
import type { AdminVenueListItem } from '../../../types/api-types';

type VenueTab = 'ACTIVE' | 'PENDING' | 'DELETED';

export const AdminVenueManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<VenueTab>('ACTIVE');
  const [venues, setVenues] = useState<AdminVenueListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVenues();
  }, [activeTab]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      // Mapping tabs to backend filters
      // ACTIVE -> is_verified: true
      // PENDING -> is_verified: false
      // DELETED -> is_active: false
      let is_verified: boolean | undefined = undefined;
      if (activeTab === 'ACTIVE') is_verified = true;
      if (activeTab === 'PENDING') is_verified = false;
      
      const data = await getAdminVenues(is_verified);
      console.log(`[DEBUG] Loaded venues for tab ${activeTab} (is_verified=${is_verified}):`, data?.length);
      
      // If filtering for deleted (inactive) venues
      if (activeTab === 'DELETED') {
        setVenues(data.filter(v => !v.is_active));
      } else {
        setVenues(data.filter(v => v.is_active));
      }
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (venue: AdminVenueListItem) => {
    Alert.alert(
      'Xác nhận duyệt',
      `Duyệt sân "${venue.name}" lên hệ thống?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Duyệt', 
          onPress: async () => {
            try {
              await verifyVenue(venue.id, true, 'Duyệt sân hợp lệ');
              loadVenues();
            } catch (error: any) {
              console.error('[DEBUG] Verify Venue Error:', error);
              const errorMsg = error.detail || error.message || 'Không thể duyệt sân';
              Alert.alert('Lỗi', errorMsg);
            }
          } 
        }
      ]
    );
  };

  const handleDelete = (venue: AdminVenueListItem) => {
    Alert.alert(
      'Xác nhận đình chỉ',
      `Bạn có chắc chắn muốn ngừng hoạt động sân "${venue.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đình chỉ', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateVenueStatus(venue.id, false, 'Vi phạm chính sách hệ thống');
              loadVenues();
            } catch (error: any) {
              console.error('[DEBUG] Deactivate Venue Error:', error);
              const errorMsg = error.detail || error.message || 'Không thể ngừng hoạt động sân';
              Alert.alert('Lỗi', errorMsg);
            }
          } 
        }
      ]
    );
  };

  const handleRestore = (venue: AdminVenueListItem) => {
    Alert.alert(
      'Xác nhận khôi phục',
      `Khôi phục sân "${venue.name}" về trạng thái hoạt động?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Khôi phục', 
          onPress: async () => {
            try {
              await updateVenueStatus(venue.id, true, 'Đã khắc phục sự cố');
              loadVenues();
            } catch (error: any) {
              console.error('[DEBUG] Restore Venue Error:', error);
              const errorMsg = error.detail || error.message || 'Không thể khôi phục sân';
              Alert.alert('Lỗi', errorMsg);
            }
          } 
        }
      ]
    );
  };

  const renderVenueItem = ({ item }: { item: AdminVenueListItem }) => (
    <View style={styles.venueCard}>
      <TouchableOpacity 
        style={styles.venueInfo} 
        onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
      >
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueOwner}>Chủ sân: {item.merchant_name}</Text>
        <View style={styles.addressContainer}>
          <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.GRAY_MEDIUM} />
          <Text style={styles.venueAddress}>{item.address}</Text>
        </View>
      </TouchableOpacity>
      
        <View style={styles.actionRow}>
          {activeTab === 'PENDING' && (
            <TouchableOpacity style={[styles.actionButton, styles.verifyButton]} onPress={() => handleVerify(item)}>
              <Text style={styles.actionButtonText}>Duyệt</Text>
            </TouchableOpacity>
          )}
          
          {activeTab === 'ACTIVE' && (
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          )}

          {activeTab === 'DELETED' && (
            <TouchableOpacity style={[styles.actionButton, styles.restoreButton]} onPress={() => handleRestore(item)}>
              <MaterialCommunityIcons name="restore" size={20} color="#4CAF50" />
              <Text style={[styles.actionButtonText, { color: '#4CAF50', marginLeft: 4 }]}>Hoàn tác</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]} 
            onPress={() => navigation.navigate('VenueDetails', { venueId: item.id })}
          >
            <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý sân</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ACTIVE' && styles.activeTab]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.activeTabText]}>Đang có</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PENDING' && styles.activeTab]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING' && styles.activeTabText]}>Chờ duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'DELETED' && styles.activeTab]}
          onPress={() => setActiveTab('DELETED')}
        >
          <Text style={[styles.tabText, activeTab === 'DELETED' && styles.activeTabText]}>Đã xóa</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={venues}
        renderItem={renderVenueItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadVenues}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="stadium-variant" size={64} color="#DDD" />
            <Text style={styles.emptyText}>Không có dữ liệu sân</Text>
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
    padding: 20,
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeTab: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.WHITE,
  },
  listContent: {
    padding: 16,
  },
  venueCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  venueInfo: {
    marginBottom: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  venueOwner: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    marginTop: 4,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  venueAddress: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F5F7FA',
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  deleteButton: {
    backgroundColor: '#F4433615',
  },
  restoreButton: {
    backgroundColor: '#4CAF5015',
  },
  viewButton: {
    backgroundColor: COLORS.PRIMARY + '10',
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: COLORS.GRAY_LIGHT,
    marginTop: 12,
    fontSize: 16,
  },
});

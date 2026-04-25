import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { getImageUrl } from '../../utils/image-upload-helper';
import { 
  fetchMerchantBookingById, 
  approveBooking, 
  rejectBooking 
} from '../../services/merchant-service';
import { formatCurrency } from '../../utils/format';

// Colors
const PRIMARY_BLUE = '#1976D2';
const BLUE_LIGHT = '#2196F3';
const HIGHLIGHT_YELLOW = '#fde047';

interface InfoItemProps {
  label: string;
  value: string;
  isYellow?: boolean;
  isClickable?: boolean;
}

const InfoItem = ({ label, value, isYellow, isClickable }: InfoItemProps) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <View style={styles.infoValueRow}>
      <Text style={[styles.infoValue, isYellow && styles.yellowText]}>{value}</Text>
      {isClickable && (
        <MaterialCommunityIcons name="phone" size={16} color={COLORS.WHITE} style={styles.clickableIcon} />
      )}
    </View>
  </View>
);

export const OwnerBookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { bookingId, booking: initialBooking } = route.params || {};
  
  const [booking, setBooking] = useState<any>(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [activeTab, setActiveTab] = useState('Thông tin');
  const tabs = ['Thông tin', 'Dịch vụ', 'Minh chứng'];

  useEffect(() => {
    if (bookingId && !initialBooking) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await fetchMerchantBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn đặt lịch.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'APPROVE' | 'CANCEL') => {
    const actionText = action === 'APPROVE' ? 'duyệt' : 'từ chối';
    Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} đơn này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            if (action === 'APPROVE') {
              await approveBooking(booking.id);
            } else {
              await rejectBooking(booking.id, { reason: 'Merchant rejected' });
            }
            loadBooking();
            // Trigger a refresh in the list screen if we can, 
            // but useFocusEffect in the list screen will handle it when user goes back.
            Alert.alert('Thành công', `Đã ${actionText} đơn đặt lịch.`);
          } catch (error) {
            Alert.alert('Lỗi', 'Thao tác thất bại.');
          }
        }
      }
    ]);
  };

  if (loading || !booking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.WHITE} />
      </View>
    );
  }

  // Helper for mapping data
  const customerName = booking.customer_name || 'Khách hàng';
  const customerPhone = booking.customer_phone || 'N/A';
  const bookingDate = booking.booking_date;
  const totalPrice = formatCurrency(booking.total_price);
  const status = booking.status;
  const slots = booking.slots || [];
  const services = booking.services || [];

  const courtNames = slots.length > 0 
    ? [...new Set(slots.map((s: any) => s.court_name).filter(Boolean))].join(', ') 
    : (booking.court_name || booking.court || 'N/A');

  const timeDisplay = slots.length > 0
    ? [...new Set(slots.map((s: any) => `${s.start_time}-${s.end_time}`))].join(', ')
    : (booking.time || 'N/A');
    
  const dateDisplay = booking.booking_date || booking.date || 'N/A';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header & Tabs */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết lịch đặt</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                {activeTab === tab && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={30} color={COLORS.WHITE} />
            </View>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.userName}>{customerName}</Text>
            <Text style={styles.userSub}>Khách đặt lịch</Text>
            <Text style={styles.userPhone}>{customerPhone}</Text>
          </View>
        </View>

        {activeTab === 'Thông tin' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={COLORS.WHITE} />
              <Text style={styles.sectionTitle}>Chi tiết</Text>
            </View>

            <View style={styles.infoList}>
              <InfoItem label="Mã đơn hàng" value={booking.id} />
              <InfoItem label="Cơ sở sân" value={booking.venueName} />
              <InfoItem label="Sân" value={courtNames} />
              <InfoItem label="Trạng thái" value={booking.status === 'PENDING' ? 'CHỜ DUYỆT' : booking.status} isYellow />
              <InfoItem label="Thời gian" value={timeDisplay} />
              <InfoItem label="Ngày tháng" value={dateDisplay} />
              <InfoItem label="Tổng phí" value={formatCurrency(booking.total_price || booking.totalPrice)} isYellow />
              <InfoItem label="Số điện thoại" value={customerPhone} isClickable />
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>YÊU CẦU DUYỆT</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Dịch vụ' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="room-service-outline" size={24} color={COLORS.WHITE} />
              <Text style={styles.sectionTitle}>Dịch vụ đính kèm</Text>
            </View>
            {services.length > 0 ? (
              services.map((svc: any, idx: number) => (
                 <View key={idx} style={styles.serviceItem}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={HIGHLIGHT_YELLOW} />
                    <Text style={styles.serviceText}>{svc.name} (x{svc.quantity})</Text>
                 </View>
              ))
            ) : (
               <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Không có dịch vụ đi kèm.</Text>
            )}
          </View>
        )}

        {activeTab === 'Minh chứng' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="file-image-outline" size={24} color={COLORS.WHITE} />
              <Text style={styles.sectionTitle}>Minh chứng thanh toán</Text>
            </View>
            {booking.payment_proof ? (
              <View style={styles.proofContainer}>
                <Image 
                  source={{ uri: getImageUrl(booking.payment_proof) }} 
                  style={styles.proofImage} 
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="image-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>Chưa có ảnh minh chứng.</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Footer for Pending Status */}
      {(booking.status === 'PENDING' || booking.status === 'Đang xếp lịch') && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => handleAction('CANCEL')}
          >
            <Text style={styles.cancelBtnText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleAction('APPROVE')}
          >
            <Text style={styles.approveBtnText}>Duyệt đơn</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_BLUE,
  },
  header: {
    backgroundColor: PRIMARY_BLUE,
    paddingBottom: 5,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 50,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    height: 50,
    marginTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: HIGHLIGHT_YELLOW,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: HIGHLIGHT_YELLOW,
    borderRadius: 3,
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3F51B5', // Indigo background for avatar
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetail: {
    flex: 1,
  },
  userName: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  userPhone: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  infoSection: {

  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    width: 100,
  },
  infoValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  yellowText: {
    color: HIGHLIGHT_YELLOW,
  },
  clickableIcon: {
    marginLeft: 8,
  },
  noteBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    borderRadius: 4,
    marginTop: 5,
  },
  noteText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  serviceText: {
    color: COLORS.WHITE,
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PRIMARY_BLUE,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    gap: 15,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  approveBtn: {
    backgroundColor: '#FF9800',
  },
  cancelBtnText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: 'bold',
  },
  approveBtnText: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: 'bold',
  },
  proofContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
    height: 400,
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
    fontSize: 14,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofPreviewContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  proofThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  viewMoreText: {
    color: HIGHLIGHT_YELLOW,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

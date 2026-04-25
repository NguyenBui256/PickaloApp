import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import type { BookingListItem, BookingResponse } from '../../types/api-types';
import { useAuthStore } from '../../store/auth-store';
import { fetchBookingById } from '../../services/booking-service';
import { formatCurrency } from '../../utils/format';
import { getImageUrl } from '../../utils/image-upload-helper';

// Helpers
const formatBookingTime = (b: any) => {
  if (b.slots && b.slots.length > 0) {
    // Group slots by time range to avoid redundancy if multiple courts booked at same time
    const timeRanges = b.slots.map((s: any) => `${s.start_time}-${s.end_time}`);
    return [...new Set(timeRanges)].join(', ');
  }
  if (b.start_time && b.end_time) return `${b.start_time} - ${b.end_time}`;
  return 'N/A';
};

const formatCourtNames = (b: any) => {
  if (b.slots && b.slots.length > 0) {
    const names = b.slots.map((s: any) => s.court_name).filter(Boolean);
    const uniqueNames = [...new Set(names)];
    return uniqueNames.length > 0 ? uniqueNames.join(', ') : 'N/A';
  }
  return b.court_name || 'N/A';
};

const formatBookingDate = (b: any) =>
  new Date(b.booking_date).toLocaleDateString('vi-VN');


// Color constants from user specs
const PRIMARY_GREEN = '#064e3b';
const EMERALD_LIGHT = '#065f46';
const HIGHLIGHT_YELLOW = '#fde047';
const CANCELLED_ORANGE = '#f97316';

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
        <MaterialCommunityIcons
          name="phone"
          size={16}
          color={COLORS.WHITE}
          style={styles.clickableIcon}
        />
      )}
    </View>
  </View>
);

export const BookingHistoryDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const user = useAuthStore(state => state.user);
  const { booking } = route.params as { booking: BookingListItem };

  const [bookingDetail, setBookingDetail] = useState<BookingResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  useEffect(() => {
    fetchBookingById(booking.id)
      .then(setBookingDetail)
      .catch(console.error)
      .finally(() => setIsLoadingDetail(false));
  }, [booking.id]);

  const [activeTab, setActiveTab] = useState('Thông tin');

  const tabs = ['Thông tin', 'Dịch vụ', 'Minh chứng', 'Đội nhóm'];

  const getStatusDisplay = () => {
    switch (booking.status) {
      case 'CANCELLED':
        return { text: 'ĐÃ HỦY', color: CANCELLED_ORANGE };
      case 'CONFIRMED':
        return { text: 'ĐÃ XÁC NHẬN', color: '#16A34A' };
      case 'COMPLETED':
        return { text: 'HOÀN THÀNH', color: COLORS.PRIMARY };
      case 'PENDING':
        return booking.payment_proof || booking.is_paid
          ? { text: 'CHỜ CHỦ SÂN DUYỆT', color: '#1976D2' }
          : { text: 'CHỜ THANH TOÁN', color: '#CA8A04' };
      default:
        return { text: booking.status, color: COLORS.GRAY_MEDIUM };
    }
  };

  const handleActionPress = () => {
    const currentBooking = bookingDetail || booking;
    if (currentBooking.status === 'COMPLETED') {
      navigation.navigate('ReviewSubmission', {
        venueId: currentBooking.venue_id,
        venueName: currentBooking.venue_name,
        bookingId: currentBooking.id,
        bookingDate: formatBookingDate(currentBooking),
        courtName: formatCourtNames(currentBooking),
        reviewId: (currentBooking as any).review_id,
      });
    }
  };

  const statusConfig = getStatusDisplay();

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
            <Text style={styles.headerTitle}>Chi tiết đặt lịch</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Loading Indicator */}
        {isLoadingDetail && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={HIGHLIGHT_YELLOW} size="large" />
            <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
          </View>
        )}

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={30} color={COLORS.WHITE} />
            </View>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.userName}>{user?.full_name || 'Người dùng'}</Text>
            <Text style={styles.userSub}>Đặt lịch ngày trực quan</Text>
            <Text style={styles.userPhone}>{user?.phone || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        {activeTab === 'Thông tin' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={24}
                color={COLORS.WHITE}
              />
              <Text style={styles.sectionTitle}>Thông tin</Text>
            </View>

            <View style={styles.infoList}>
              <InfoItem label="Mã đơn hàng" value={booking.id} />
              <InfoItem label="Câu lạc bộ" value={booking.venue_name ?? ''} />
              <InfoItem label="Sân" value={formatCourtNames(bookingDetail || booking)} />
              <InfoItem
                label="Trạng thái"
                value={statusConfig.text}
                isYellow
              />
              <InfoItem label="Thời gian" value={formatBookingTime(bookingDetail || booking)} />
              <InfoItem label="Ngày tháng" value={formatBookingDate(bookingDetail || booking)} />
              <InfoItem label="Tổng tiền" value={formatCurrency(bookingDetail?.total_price || booking.total_price)} isYellow />
              <InfoItem label="Số điện thoại" value={user?.phone || 'N/A'} isClickable />
              <InfoItem label="Địa chỉ" value={booking.venue_address ?? ''} />
            </View>

            <View style={styles.customerNote}>
              <Text style={styles.noteLabel}>Khách hàng ghi chú:</Text>
              <View style={styles.noteContent}>
                <Text style={styles.noteValue}>{bookingDetail?.notes || 'Không có ghi chú'}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Dịch vụ' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="room-service-outline"
                size={24}
                color={COLORS.WHITE}
              />
              <Text style={styles.sectionTitle}>Dịch vụ</Text>
            </View>
            <View style={styles.infoList}>
              {bookingDetail?.services && bookingDetail.services.length > 0 ? (
                bookingDetail.services.map((s, idx) => (
                  <InfoItem 
                    key={idx} 
                    label={s.name} 
                    value={`x${s.quantity} (${formatCurrency(s.total)})`} 
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>Không có dịch vụ đi kèm</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'Minh chứng' && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="file-image-outline"
                size={24}
                color={COLORS.WHITE}
              />
              <Text style={styles.sectionTitle}>Minh chứng thanh toán</Text>
            </View>
            <View style={styles.proofContainer}>
              {(bookingDetail?.payment_proof || booking.payment_proof) ? (
                <View>
                   <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 15 }}>
                     Đây là ảnh xác nhận thanh toán của bạn.
                   </Text>
                   <View style={styles.imageWrapper}>
                      <Image 
                        source={{ uri: getImageUrl(bookingDetail?.payment_proof || booking.payment_proof) }} 
                        style={styles.proofImage}
                        resizeMode="contain"
                      />
                   </View>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                   <MaterialCommunityIcons name="image-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                   <Text style={styles.emptyText}>Chưa có ảnh minh chứng được tải lên.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'Đội nhóm' && (
          <View style={styles.emptyTab}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={40}
              color="rgba(255,255,255,0.3)"
            />
            <Text style={styles.emptyText}>Đang cập nhật...</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: statusConfig.color }]}
          onPress={handleActionPress}
        >
          <Text style={styles.actionBtnText}>{statusConfig.text}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  header: {
    backgroundColor: PRIMARY_GREEN,
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
    backgroundColor: EMERALD_LIGHT,
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
    backgroundColor: '#ec4899', // Pink background for avatar
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
  infoSection: {},
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
  customerNote: {
    marginTop: 30,
    gap: 10,
  },
  noteLabel: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 15,
  },
  noteContent: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
  },
  noteValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  emptyTab: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
  },
  proofContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
  },
  imageWrapper: {
    width: '100%',
    height: 400,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.WHITE,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 40,
    backgroundColor: PRIMARY_GREEN,
  },
  actionBtn: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

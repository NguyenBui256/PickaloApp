import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import type { BookingListItem } from '../../types/api-types';

// Helpers
const formatBookingTime = (b: BookingListItem) => `${b.start_time} - ${b.end_time}`;
const formatBookingDate = (b: BookingListItem) =>
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
  const { booking } = route.params as { booking: BookingListItem };

  const [activeTab, setActiveTab] = useState('Thông tin');

  const tabs = ['Thông tin', 'Dịch vụ', 'Đội nhóm'];

  const getButtonConfig = () => {
    switch (booking.status) {
      case 'CANCELLED':
        return { text: 'BẠN ĐÃ HỦY ĐƠN', color: CANCELLED_ORANGE };
      case 'CONFIRMED':
        return { text: 'ĐÃ XÁC NHẬN', color: '#16A34A' };
      case 'COMPLETED':
        return {
          text: booking.review_id ? 'XEM ĐÁNH GIÁ' : 'ĐÁNH GIÁ NGAY',
          color: COLORS.PRIMARY,
        };
      default:
        return { text: 'CHỜ XÁC NHẬN', color: '#CA8A04' };
    }
  };

  const handleActionPress = () => {
    if (booking.status === 'COMPLETED') {
      navigation.navigate('ReviewSubmission', {
        venueId: booking.venue_id,
        venueName: booking.venue_name,
        bookingId: booking.id,
        reviewId: booking.review_id,
      });
    }
  };

  const buttonConfig = getButtonConfig();

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
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={30} color={COLORS.WHITE} />
            </View>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.userName}>Phạm Ngọc Long</Text>
            <Text style={styles.userSub}>Đặt lịch ngày trực quan</Text>
            <Text style={styles.userPhone}>+84 0303030303</Text>
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
              <InfoItem
                label="Trạng thái"
                value={booking.status === 'CANCELLED' ? 'Bạn đã hủy đơn' : 'Đã thanh toán'}
                isYellow
              />
              <InfoItem label="Thời gian" value={formatBookingTime(booking)} />
              <InfoItem label="Ngày tháng" value={formatBookingDate(booking)} />
              <InfoItem label="Thanh phí" value="Chưa thanh toán" isYellow />
              <InfoItem label="Số điện thoại" value="0333333333" isClickable />
              <InfoItem label="Địa chỉ" value={booking.venue_address ?? ''} />
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>SÂN NGOÀI TRỜI</Text>
              </View>
            </View>

            <View style={styles.customerNote}>
              <Text style={styles.noteLabel}>Khách hàng ghi chú:</Text>
              <View style={styles.noteContent}>
                <Text style={styles.noteValue}>Lấy thêm 2 chai nước suối lạnh.</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab !== 'Thông tin' && (
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
          style={[styles.actionBtn, { backgroundColor: buttonConfig.color }]}
          onPress={handleActionPress}
        >
          <Text style={styles.actionBtnText}>{buttonConfig.text}</Text>
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

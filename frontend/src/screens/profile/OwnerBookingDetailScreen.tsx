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

// MOCK_DATA type
type OwnerBooking = {
  id: string;
  customerName: string;
  phone: string;
  venueName: string;
  court: string;
  time: string;
  date: string;
  status: string;
  services: string[];
  totalPrice: number;
};

// Colors
const PRIMARY_BLUE = '#1976D2';
const BLUE_LIGHT = '#2196F3';
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
        <MaterialCommunityIcons name="phone" size={16} color={COLORS.WHITE} style={styles.clickableIcon} />
      )}
    </View>
  </View>
);

export const OwnerBookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Safe default for testing before proper param passing if needed
  const [booking, setBooking] = useState<OwnerBooking>(
    route.params?.booking || {
      id: 'ERR',
      customerName: 'Không xác định',
      phone: '0000000',
      venueName: 'Lỗi nạp liệu',
      court: 'N/A',
      time: '00:00',
      date: '00-00-00',
      status: 'PENDING',
      services: [],
      totalPrice: 0,
    }
  );

  const [activeTab, setActiveTab] = useState('Thông tin');
  const tabs = ['Thông tin', 'Dịch vụ'];

  const handleAction = (action: 'APPROVE' | 'CANCEL') => {
    // In a real app we would call API here
    if (action === 'APPROVE') {
      setBooking({ ...booking, status: 'Đã duyệt' });
    } else {
      setBooking({ ...booking, status: 'Đã hủy' });
    }
  };

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
            <Text style={styles.userName}>{booking.customerName}</Text>
            <Text style={styles.userSub}>Khách đặt lịch</Text>
            <Text style={styles.userPhone}>{booking.phone}</Text>
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
              <InfoItem label="Sân" value={booking.court} />
              <InfoItem label="Trạng thái" value={booking.status === 'Đang xếp lịch' || booking.status === 'PENDING' ? 'Mới' : booking.status} isYellow />
              <InfoItem label="Thời gian" value={booking.time} />
              <InfoItem label="Ngày tháng" value={booking.date} />
              <InfoItem label="Tổng phí" value={`${booking.totalPrice.toLocaleString('vi-VN')} đ`} isYellow />
              <InfoItem label="Số điện thoại" value={booking.phone} isClickable />
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
            {booking.services.length > 0 ? (
              booking.services.map((svc, idx) => (
                 <View key={idx} style={styles.serviceItem}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={HIGHLIGHT_YELLOW} />
                    <Text style={styles.serviceText}>{svc}</Text>
                 </View>
              ))
            ) : (
               <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Không có dịch vụ đi kèm.</Text>
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
});

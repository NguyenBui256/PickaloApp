import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import COLORS from '@theme/colors';
import type { BookingListItem } from '../../types/api-types';
import { fetchMyBookings, cancelBooking } from '../../services/booking-service';
import { matchService } from '../../services/match-service';
import { CreateMatchModal } from '../match/CreateMatchModal';

// Helpers
const formatBookingTime = (b: BookingListItem) => {
  if (b.start_time && b.end_time) return `${b.start_time} - ${b.end_time}`;
  return 'N/A';
};

const formatBookingDate = (b: BookingListItem) =>
  new Date(b.booking_date).toLocaleDateString('vi-VN');
const formatBookingPrice = (b: BookingListItem) =>
  `${Number(b.total_price || 0).toLocaleString('vi-VN')} đ`;

const Ribbon = ({ text }: { text: string }) => (
  <View style={styles.ribbonContainer}>
    <View style={styles.ribbonMain}>
      <Text style={styles.ribbonText}>{text}</Text>
    </View>
    <View style={styles.ribbonTail}>
      <View style={styles.tailTriangle} />
    </View>
  </View>
);

const BookingCard = ({
  item,
  onPublishMatch,
  onDeleteMatch,
  onCancelBooking,
}: {
  item: BookingListItem;
  onPublishMatch: (item: BookingListItem) => void;
  onDeleteMatch: (item: BookingListItem) => void;
  onCancelBooking: (item: BookingListItem) => void;
}) => {
  const isCanceled = item.status === 'CANCELLED';
  const isSuccess = item.status === 'CONFIRMED' || item.status === 'COMPLETED';

  const getStatusConfig = () => {
    switch (item.status) {
      case 'CANCELLED':
        return { label: 'Đã hủy', color: '#EA580C', icon: 'close-circle' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', color: '#16A34A', icon: 'check-circle' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', color: '#16A34A', icon: 'check-circle' };
      case 'PENDING':
        return item.payment_proof || item.is_paid 
          ? { label: 'Chờ chủ sân duyệt', color: '#1976D2', icon: 'clock-check' }
          : { label: 'Chờ thanh toán', color: '#CA8A04', icon: 'clock-outline' };
      default:
        return { label: item.status, color: COLORS.GRAY_MEDIUM, icon: 'help-circle' };
    }
  };

  const status = getStatusConfig();

  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BookingHistoryDetail', { booking: item })}
    >
      <Ribbon text="Đơn ngày" />

      <View style={styles.cardHeader}>
        <Text style={styles.clubName} numberOfLines={2}>
          {item.venue_name}
        </Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          <MaterialCommunityIcons name={status.icon as any} size={18} color={status.color} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Chi tiết:</Text>
          <Text style={styles.infoValue}>
            {`${item.court_name ? `${item.court_name} | ` : ''}${formatBookingTime(item)} | ${formatBookingDate(item)}`}
          </Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoLabel}>Địa chỉ:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.venue_address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{formatBookingPrice(item)}</Text>
        <View style={styles.footerActions}>
          {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
            <TouchableOpacity
              style={[styles.detailBtn, styles.cancelBookingBtn]}
              onPress={() => onCancelBooking(item)}
            >
              <Text style={[styles.detailBtnText, styles.cancelBookingBtnText]}>Hủy lịch</Text>
            </TouchableOpacity>
          )}
          {item.status === 'CONFIRMED' && (
            item.has_match ? (
              <TouchableOpacity
                style={[styles.detailBtn, styles.deleteMatchBtn]}
                onPress={() => onDeleteMatch(item)}
              >
                <Text style={[styles.detailBtnText, styles.deleteMatchBtnText]}>Xóa kèo</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.detailBtn, styles.publishBtn]}
                onPress={() => onPublishMatch(item)}
              >
                <Text style={[styles.detailBtnText, styles.publishBtnText]}>Mở kèo</Text>
              </TouchableOpacity>
            )
          )}
          {item.status === 'COMPLETED' && (
            <TouchableOpacity
              style={[styles.detailBtn, styles.reviewBtn]}
              onPress={() =>
                  navigation.navigate('ReviewSubmission', {
                    venueId: item.venue_id,
                    venueName: item.venue_name,
                    bookingId: item.id,
                    bookingDate: formatBookingDate(item),
                    courtName: item.court_name,
                    reviewId: item.review_id,
                  })
              }
            >
              <Text style={[styles.detailBtnText, styles.reviewBtnText]}>
                {`${item.review_id ? 'Xem đánh giá' : 'Đánh giá'}`}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => navigation.navigate('BookingHistoryDetail', { booking: item })}
          >
            <Text style={styles.detailBtnText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const BookingListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [createMatchTarget, setCreateMatchTarget] = useState<BookingListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMyBookings();
      if (res?.items) {
        setBookings(res.items as any);
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteMatch = async (booking: BookingListItem) => {
    if (!booking.match_id) return;
    
    Alert.alert(
      'Xóa kèo ghép',
      'Bạn có chắc chắn muốn gỡ bỏ kèo ghép này không? Toàn bộ yêu cầu tham gia và phòng chat sẽ bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await matchService.deleteMatch(booking.match_id as string);
              loadBookings();
            } catch (error) {
              console.error('Delete match error:', error);
              Alert.alert('Lỗi', 'Không thể xóa kèo ghép vào lúc này.');
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = (booking: BookingListItem) => {
    Alert.alert(
      'Hủy đặt lịch',
      'Bạn có chắc chắn muốn hủy đặt lịch này không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy lịch', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await cancelBooking(booking.id, { reason: 'Người dùng tự hủy lịch' });
              loadBookings();
              Alert.alert('Thành công', 'Đã hủy lịch thành công');
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Lỗi', 'Không thể hủy lịch vào lúc này. Có thể đã quá giờ hoặc phụ thuộc vào chính sách của sân.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={30} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Danh sách đặt lịch</Text>
            <View style={{ width: 30 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        <TouchableOpacity style={styles.filterBar}>
          <Text style={styles.filterText}>Xem tất cả</Text>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={COLORS.GRAY_MEDIUM}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard 
            item={item} 
            onPublishMatch={(b) => setCreateMatchTarget(b)} 
            onDeleteMatch={handleDeleteMatch}
            onCancelBooking={handleCancelBooking}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <CreateMatchModal
        visible={!!createMatchTarget}
        booking={createMatchTarget}
        onClose={() => setCreateMatchTarget(null)}
        onSuccess={() => {
          setCreateMatchTarget(null);
          // Refresh list to hide the "Mở ghép kèo" button
          fetchMyBookings().then((res) => {
            if (res?.items) {
              setBookings(res.items as any);
            }
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Light Mint Green
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  backBtn: {
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  filterSection: {
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    paddingTop: 24, // Space for ribbon
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  ribbonContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    flexDirection: 'row',
  },
  ribbonMain: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  ribbonText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ribbonTail: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tailTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.WHITE,
    transform: [{ rotate: '180deg' }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  clubName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C2410C', // Orange-700
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 6,
    marginBottom: 15,
  },
  infoLine: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    width: 60,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  detailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  detailBtnText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewBtn: {
    backgroundColor: COLORS.PRIMARY,
  },
  reviewBtnText: {
    color: COLORS.WHITE,
  },
  publishBtn: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  publishBtnText: {
    color: '#F97316',
  },
  deleteMatchBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  deleteMatchBtnText: {
    color: '#EF4444',
  },
  cancelBookingBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  cancelBookingBtnText: {
    color: '#EF4444',
  },
});

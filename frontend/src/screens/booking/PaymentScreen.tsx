import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '@theme/colors';
import { fetchVenueById } from '../../services/venue-service';
import { InfoCard } from '../../components/InfoCard';
import { useAuthStore } from '../../store/auth-store';
import { formatCurrency } from '../../utils/format';
import { cancelBooking } from '../../services/booking-service';


export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { 
    venueId, 
    bookingDate, 
    selectedSlotsData = [], 
    totalAmount = 0 
  } = route.params || {};
  const user = useAuthStore(state => state.user);

  const [venue, setVenue] = useState<any>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (venueId) {
      fetchVenueById(venueId).then(res => setVenue(res));
    }
  }, [venueId]);

  const isFormValid = user?.full_name && user?.phone;
  const totalPrice = totalAmount;
  const bookingId = route.params.bookingId;

  const handleCancel = () => {
    Alert.alert(
      'Hủy đặt sân',
      'Bạn có chắc chắn muốn hủy đơn đặt sân này không? Các ô giờ đã chọn sẽ được nhả ra cho người khác.',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Đồng ý hủy', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (bookingId) {
                await cancelBooking(bookingId);
                navigation.navigate('Main', { screen: 'Home' });
              }
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Lỗi', 'Không thể hủy đơn đặt sân. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin đặt sân</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelHeaderBtn}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Venue Info */}
          <InfoCard title="Thông tin sân" iconName="map-marker-radius">
            <Text style={styles.venueName}>{venue?.name || 'Tên sân'}</Text>
            <Text style={styles.venueAddress}>{venue?.fullAddress || venue?.address}</Text>
          </InfoCard>

          {/* Section 2: Booking Info */}
          <InfoCard title="Thông tin lịch đặt" iconName="ticket-confirmation">
            {selectedSlotsData.map((slot: any, index: number) => {
              return (
                <View key={index} style={styles.slotRow}>
                  <View style={styles.slotDetail}>
                    <Text style={styles.courtText}>{slot.courtName}</Text>
                    <Text style={styles.timeText}>Khung giờ: {slot.time}</Text>
                  </View>
                  <Text style={styles.slotPrice}>{formatCurrency(slot.price)}</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng tiền</Text>
               <Text style={styles.totalPriceText}>{formatCurrency(totalPrice)}</Text>
            </View>
          </InfoCard>

          {/* Section 3: Offers */}
          <View style={styles.offerRow}>
            <View style={styles.offerLeft}>
              <MaterialCommunityIcons name="tag-outline" size={20} color={COLORS.WHITE} />
              <TouchableOpacity>
                <Text style={styles.offerLink}>Chọn ưu đãi</Text>
              </TouchableOpacity>
            </View>
            <MaterialCommunityIcons name="plus" size={24} color="#EAB308" />
          </View>

          {/* Section 4: Customer Details (Read-only) */}
          <View style={styles.formContainer}>
            <View style={styles.infoGroup}>
              <Text style={styles.label}>HỌ TÊN</Text>
              <View style={styles.infoDisplay}>
                <Text style={styles.infoText}>{user?.full_name || 'Chưa cập nhật'}</Text>
                <MaterialCommunityIcons name="check-circle" size={20} color="#15803d" />
              </View>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
              <View style={styles.infoDisplay}>
                <View style={styles.phoneDisplay}>
                  <Text style={styles.flag}>🇻🇳</Text>
                  <Text style={styles.infoText}>{user?.phone || 'Chưa cập nhật'}</Text>
                </View>
                <MaterialCommunityIcons name="check-circle" size={20} color="#15803d" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GHI CHÚ CHO CHỦ SÂN</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú"
                placeholderTextColor={COLORS.GRAY_MEDIUM}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Section 5: Notice Box */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeHeader}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#EAB308" />
              <Text style={styles.noticeTitle}>Lưu ý</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Hủy hoặc dời lịch trước khi thi đấu ít nhất 24 tiếng được hoàn 100%.</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Hủy lịch thi đấu trong 2 tiếng được hoàn 50% tiền sân vào ví.</Text>
            </View>

            <View style={styles.noticeFooter}>
              <TouchableOpacity>
                <Text style={styles.noticeLink}>Điều khoản đặt sân</Text>
              </TouchableOpacity>
              <Text style={styles.pipe}>|</Text>
              <TouchableOpacity>
                <Text style={styles.noticeLink}>Chính sách hoàn tiền</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, !isFormValid && styles.disabledBtn]}
          disabled={!isFormValid}
          onPress={() => navigation.navigate('FinalPayment', {
            venueId: venueId,
            bookingDate: bookingDate,
            slots: selectedSlotsData.map((s: any) => ({
              court_id: s.courtId,
              start_time: s.time.split(' - ')[0],
              end_time: s.time.split(' - ')[1],
            })),
            services: [], 
            totalPrice: formatCurrency(totalPrice),
            totalAmount: totalPrice,
            bookingId: route.params.bookingId, // Use the real bookingId
            customerName: user?.full_name || '',
            customerPhone: user?.phone || '',
            note: note.trim(),
          })}
        >
          <Text style={styles.payBtnText}>XÁC NHẬN & THANH TOÁN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b', // Solid Dark Green
  },
  headerArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  cancelHeaderBtn: {
    padding: 8,
  },
  cancelText: {
    color: '#FECACA', // Light red
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
  },
  venueName: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  venueAddress: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  slotDetail: {
    flex: 1,
  },
  courtText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  slotPrice: {
    color: '#EAB308',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  totalPriceText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 18,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#053e30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerLink: {
    color: COLORS.WHITE,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  formContainer: {
    gap: 20,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  infoGroup: {
    gap: 8,
  },
  label: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  infoDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoText: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  input: {
    flex: 1,
    color: COLORS.BLACK,
    fontSize: 16,
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
  },
  noticeBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  noticeTitle: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bullet: {
    color: 'rgba(255,255,255,0.8)',
  },
  bulletText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    flex: 1,
  },
  noticeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  noticeLink: {
    color: COLORS.WHITE,
    textDecorationLine: 'underline',
    fontSize: 12,
  },
  pipe: {
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#064e3b',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  payBtn: {
    backgroundColor: '#EAB308',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
  },
  payBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

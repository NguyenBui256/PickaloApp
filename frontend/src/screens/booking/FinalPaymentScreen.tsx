import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import COLORS from '@theme/colors';
import { BANK_DETAILS } from '../../constants/mock-data';
import { useAuthStore } from '../../store/auth-store';
import { updateBookingProof, cancelBooking } from '../../services/booking-service';
import { uploadPaymentProof } from '../../services/image-service';

// Internal Helper Component
const InfoRow = ({ label, value, iconName }: { label: string, value: string, iconName: any }) => (
  <View style={styles.infoRow}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={iconName} size={18} color="#15803d" />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

export const FinalPaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { 
    totalPrice = '190.000', 
    bookingId = 'ALOBO12345',
    venueId,
    bookingDate,
    slots = [],
    services = [],
    totalAmount,
    note
  } = route.params || {};

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft === 0) {
      Alert.alert('Hết thời gian', 'Thời gian giữ chỗ của bạn đã hết. Vui lòng thực hiện lại.', [
        { text: 'OK', onPress: () => navigation.popToTop() }
      ]);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const { user } = useAuthStore();
  
  const handleConfirmPayment = async () => {
    if (!proofImage) {
      Alert.alert('Thiếu minh chứng', 'Vui lòng tải ảnh minh chứng chuyển khoản để tiếp tục.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload proof image
      const formData = new FormData();
      const uriParts = proofImage.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('file', {
        uri: proofImage,
        name: `payment_proof_${bookingId}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const uploadRes = await uploadPaymentProof(formData);
      
      // 2. Update booking with proof
      await updateBookingProof(bookingId, uploadRes.url);

      Alert.alert(
        'Thành công', 
        'Đơn đặt sân đã được gửi. Vui lòng chờ chủ sân xác nhận.',
        [{ 
          text: 'OK', 
          onPress: () => {
            const initialScreen = user?.role === 'MERCHANT' ? 'Dashboard' : 'Home';
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main', params: { screen: initialScreen } }],
            });
          } 
        }]
      );
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      Alert.alert('Lỗi', error.response?.data?.detail || 'Không thể xác nhận thanh toán. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelHeaderBtn}>
              <Text style={styles.cancelText}>Hủy đơn</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Countdown Banner */}
        <View style={styles.timerBanner}>
          <Text style={styles.timerText}>
            Đơn của bạn còn được giữ chỗ trong <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
          </Text>
        </View>

        {/* Booking Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin đặt lịch</Text>
          <InfoRow label="Mã đơn hàng" value={bookingId} iconName="identifier" />
          <InfoRow label="Hình thức" value="Đặt lịch ngày trực quan" iconName="calendar-clock" />
          <InfoRow label="Tổng tiền" value={`${totalPrice} đ`} iconName="cash-multiple" />
        </View>

        {/* Bank Account Details */}
        <View style={styles.bankDetailsBox}>
          <View style={styles.logosRow}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="bank" size={30} color="#15803d" />
            </View>
            <MaterialCommunityIcons name="transfer-right" size={20} color={COLORS.GRAY_MEDIUM} />
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="alpha-a-box" size={30} color={COLORS.PRIMARY} />
            </View>
          </View>

          <Text style={styles.bankName}>{BANK_DETAILS.bankName}</Text>

          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>CHỦ TÀI KHOẢN</Text>
            <Text style={styles.accountValue}>{BANK_DETAILS.accountHolder}</Text>
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>SỐ TÀI KHOẢN</Text>
            <Text style={styles.accountValue}>{BANK_DETAILS.accountNumber}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>Sao chép số tài khoản</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Proof Section */}
        <View style={styles.proofSection}>
          <Text style={styles.sectionTitle}>Minh chứng thanh toán</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {proofImage ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: proofImage }} style={styles.proofPreview} />
                <View style={styles.changeOverlay}>
                  <MaterialCommunityIcons name="camera-flip" size={24} color={COLORS.WHITE} />
                  <Text style={styles.changeText}>Thay đổi ảnh</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={48} color={COLORS.PRIMARY} />
                <Text style={styles.uploadTitle}>Tải ảnh chuyển khoản</Text>
                <Text style={styles.uploadDesc}>Chụp màn hình giao dịch thành công</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.verifyBtn, (!proofImage || isSubmitting) && styles.disabledBtn]}
          onPress={handleConfirmPayment}
          disabled={!proofImage || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.verifyBtnText}>XÁC NHẬN ĐÃ THANH TOÁN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backBtn: {
    padding: 5,
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
    paddingBottom: 30,
  },
  timerBanner: {
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    color: '#15803d',
    fontSize: 14,
  },
  timerBold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  sectionTitle: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  gatewayBox: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#15803d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  gatewayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankLogoSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatewayText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#15803d',
  },
  bankDetailsBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  bankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  accountInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  accountLabel: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    letterSpacing: 1,
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  copyBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#15803d',
  },
  copyBtnText: {
    color: '#15803d',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  verifyBtn: {
    backgroundColor: '#10b981', // Emerald Green
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
  },
  proofSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  uploadBox: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderStyle: 'dashed',
    height: 180,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginTop: 10,
  },
  uploadDesc: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 4,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  proofPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  changeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

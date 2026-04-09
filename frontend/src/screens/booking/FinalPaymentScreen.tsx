import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { BANK_DETAILS } from '../../constants/mock-data';

// Internal Helper Component
const InfoRow = ({ label, value, iconName }: { label: string, value: string, iconName: string }) => (
  <View style={styles.infoRow}>
    <View style={styles.iconContainer}>
      <Icon name={iconName} size={18} color="#15803d" />
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
  const { totalPrice = '190.000', bookingId = 'ALOBO12345' } = route.params || {};

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (timeLeft === 0) {
      Alert.alert('Hết thời gian', 'Thời gian giữ chỗ của bạn đã hết. Vui lòng thực hiện lại.');
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <View style={{ width: 40 }} />
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

        {/* Payment Gateway Selector */}
        <Text style={styles.sectionTitle}>Chọn cổng thanh toán</Text>
        <TouchableOpacity style={styles.gatewayBox}>
          <View style={styles.gatewayContent}>
            <View style={styles.bankLogoSmall}>
              <Icon name="bank" size={20} color="#15803d" />
            </View>
            <Text style={styles.gatewayText}>Do dang du</Text>
          </View>
          <Icon name="check-circle" size={24} color="#15803d" />
        </TouchableOpacity>

        {/* Bank Account Details */}
        <View style={styles.bankDetailsBox}>
          <View style={styles.logosRow}>
            <View style={styles.logoCircle}>
              <Icon name="bank" size={30} color="#15803d" />
            </View>
            <Icon name="transfer-right" size={20} color={COLORS.GRAY_MEDIUM} />
            <View style={styles.logoCircle}>
               <Icon name="alpha-a-box" size={30} color={COLORS.PRIMARY} />
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.verifyBtn}
          onPress={() => Alert.alert('Thông báo', 'Hệ thống đang kiểm tra giao dịch của bạn.')}
        >
          <Text style={styles.verifyBtnText}>KIỂM TRA THANH TOÁN</Text>
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
});

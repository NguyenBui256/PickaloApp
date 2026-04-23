import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { useAuthStore } from '../../store/auth-store';

const VERSION = '2.9.0';
const { width } = Dimensions.get('window');

interface MenuItemProps {
  icon: any;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, value, color = COLORS.GRAY_MEDIUM, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={styles.menuRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.GRAY_MEDIUM} />
    </View>
  </TouchableOpacity>
);

export const OwnerProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <LinearGradient
          colors={['#1976D2', '#1565C0']}
          style={styles.header}
        >
          <SafeAreaView>
            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?u=owner' }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>Chủ Sân ALOBO</Text>
                <Text style={styles.userEmail}>owner@alobo.vn</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.membershipCard}>
              <View style={styles.membershipLeft}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#E3B129" />
                <Text style={styles.membershipText}>Đối tác thân thiết</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.GRAY_MEDIUM} />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Quick Action Grid */}
          <View style={styles.quickActionGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('MyVenues')}>
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="storefront-outline" size={24} color="#1976D2" />
              </View>
              <Text style={styles.quickLabel}>Quản lý sân</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Services')}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="room-service-outline" size={24} color="#F57C00" />
              </View>
              <Text style={styles.quickLabel}>Dịch vụ</Text>
            </TouchableOpacity>
          </View>

          {/* Cấu hình hệ thống thanh toán / liên lạc */}
          <View style={styles.menuGroup}>
            <Text style={styles.groupTitle}>Thông tin liên hệ</Text>
            <View style={styles.menuCard}>
              <MenuItem icon="phone-outline" label="Hotline hỗ trợ khách hàng" value="0333 444 555" />
              <View style={styles.divider} />
              <MenuItem icon="email-outline" label="Email kinh doanh" value="owner@alobo.vn" />
              <View style={styles.divider} />
              <MenuItem icon="credit-card-outline" label="Tài khoản nhận tiền" value="MB BANK" />
            </View>
          </View>

          <View style={styles.menuGroup}>
            <Text style={styles.groupTitle}>Hệ thống</Text>
            <View style={styles.menuCard}>
              <MenuItem 
                icon="cog-outline" 
                label="Cài đặt chung" 
                onPress={() => navigation.navigate('Settings')}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="information-outline"
                label="Thông tin phiên bản"
                value={VERSION}
              />
              <View style={styles.divider} />
              <MenuItem icon="shield-check-outline" label="Chính sách cho đối tác" />
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  membershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membershipText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    minWidth: (width - 55) / 2,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  menuGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.WHITE,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 52,
  },
  logoutBtn: {
    height: 56,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

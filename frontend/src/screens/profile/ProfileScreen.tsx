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

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <LinearGradient
          colors={[COLORS.PRIMARY, '#165c36']}
          style={styles.header}
        >
          <SafeAreaView>
            <TouchableOpacity 
              style={styles.profileRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?u=default' }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.full_name || 'Người dùng'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'Chưa cập nhật email'}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.WHITE} />
            </TouchableOpacity>

            {/* Membership Status Card removed per request */}
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Quick Action Grid */}
          <View style={styles.quickActionGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate('BookingList')}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(15, 107, 58, 0.1)' }]}>
                <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.quickLabel}>Lịch đã đặt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(230, 126, 34, 0.1)' }]}>
                <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#E67E22" />
              </View>
              <Text style={styles.quickLabel}>Thông báo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Settings')}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                <MaterialCommunityIcons name="cog-outline" size={24} color="#3498DB" />
              </View>
              <Text style={styles.quickLabel}>Cài đặt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={24} color="#9B59B6" />
              </View>
              <Text style={styles.quickLabel}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Groups */}
          <View style={styles.menuGroup}>
            <Text style={styles.groupTitle}>Tài khoản & Bảo mật</Text>
            <View style={styles.menuCard}>
              <MenuItem 
                icon="message-text-outline" 
                label="Tin nhắn ghép kèo" 
                color="#F97316"
                onPress={() => navigation.navigate('ChatList')}
              />
              <View style={styles.divider} />
              <MenuItem icon="account-group-outline" label="Nhóm của tôi" />
              <View style={styles.divider} />
              <MenuItem icon="format-list-bulleted" label="Danh sách lịch học" />
              <View style={styles.divider} />
              <MenuItem
                icon="account-edit-outline" 
                label="Chỉnh sửa hồ sơ" 
                onPress={() => navigation.navigate('EditProfile')}
              />
              <View style={styles.divider} />
              <MenuItem icon="shield-lock-outline" label="Đổi mật khẩu" />
            </View>
          </View>

          <View style={styles.menuGroup}>
            <Text style={styles.groupTitle}>Hệ thống</Text>
            <View style={styles.menuCard}>
              <MenuItem 
                icon="cog-outline" 
                label="Cài đặt" 
                onPress={() => navigation.navigate('Settings')}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="information-outline"
                label="Thông tin phiên bản"
                value={VERSION}
              />
              <View style={styles.divider} />
              <MenuItem icon="shield-check-outline" label="Điều khoản và chính sách" />
              <View style={styles.divider} />
              <MenuItem icon="new-box" label="Ứng dụng có gì mới" />
              <View style={styles.divider} />
              <MenuItem 
                icon="logout" 
                label="Đăng xuất" 
                color={COLORS.ERROR}
                onPress={logout}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginTop: 2,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  membershipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  quickCard: {
    width: (width - 60) / 4,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuGroup: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 13,
    color: COLORS.GRAY_MEDIUM,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginLeft: 52,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '@theme/colors';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handlePasswordChange = () => {
    Alert.alert('Đổi mật khẩu', 'Tính năng này đang được phát triển.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xác nhận xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa vĩnh viễn', 
          style: 'destructive',
          onPress: () => Alert.alert('Thông báo', 'Yêu cầu của bạn đã được ghi nhận và sẽ được xử lý trong 24h.')
        }
      ]
    );
  };

  const SettingItem = ({ icon, label, children, onPress, isDestructive = false }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={isDestructive ? COLORS.ERROR : COLORS.TEXT_PRIMARY} />
        <Text style={[styles.settingLabel, isDestructive && { color: COLORS.ERROR }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {children}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <View style={styles.card}>
            <SettingItem icon="bell-outline" label="Thông báo ứng dụng">
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: COLORS.PRIMARY }}
                thumbColor={COLORS.WHITE}
              />
            </SettingItem>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bảo mật</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="lock-outline" 
              label="Đổi mật khẩu" 
              onPress={handlePasswordChange}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.GRAY_MEDIUM} />
            </SettingItem>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.card}>
            <SettingItem 
              icon="trash-can-outline" 
              label="Xóa tài khoản" 
              isDestructive
              onPress={handleDeleteAccount}
            />
          </View>
          <Text style={styles.infoText}>Khi xóa tài khoản, mọi dữ liệu đặt sân và lịch sử của bạn sẽ bị xóa vĩnh viễn.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 10,
    marginLeft: 5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
});

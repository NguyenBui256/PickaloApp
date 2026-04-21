import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import COLORS from '@theme/colors';
import { AuthCard } from '../../components/AuthCard';
import { TabSwitch } from '../../components/TabSwitch';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SocialButton } from '../../components/SocialButton';
import { useAuthStore } from '../../store/auth-store';
import { MOCK_USER, MOCK_REGISTER_PAYLOAD, MOCK_OWNER, MOCK_OWNER_REGISTER_PAYLOAD } from '../../constants/mock-data';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
};

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    const login = useAuthStore.getState().login;
    setIsLoading(true);

    // Chuẩn hóa số điện thoại để khớp với mock data (+84...)
    let normalizedPhone = phoneNumber;
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+84' + normalizedPhone.slice(1);
    } else if (normalizedPhone.length > 0 && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+84' + normalizedPhone;
    }

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      if (
        (activeTab === 'phone' && normalizedPhone === MOCK_REGISTER_PAYLOAD.phone && password === MOCK_REGISTER_PAYLOAD.password) ||
        (activeTab === 'email' && email === MOCK_USER.email && password === MOCK_REGISTER_PAYLOAD.password)
      ) {
        login(MOCK_USER, 'mock-jwt-token');
      } else if (
        (activeTab === 'phone' && normalizedPhone === MOCK_OWNER_REGISTER_PAYLOAD.phone && password === MOCK_OWNER_REGISTER_PAYLOAD.password) ||
        (activeTab === 'email' && email === MOCK_OWNER.email && password === MOCK_OWNER_REGISTER_PAYLOAD.password)
      ) {
        login(MOCK_OWNER, 'mock-jwt-token-owner');
      } else {
        Alert.alert('Đăng nhập thất bại', 'Số điện thoại/Email hoặc mật khẩu không chính xác.');
      }
    }, 1500);
  };

  return (
    <LinearGradient colors={COLORS.GRADIENT_ORANGE} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đăng nhập</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Auth Card */}
            <AuthCard style={styles.card}>
              <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'phone' ? (
                <CustomInput
                  type="phone"
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onClear={() => setPhoneNumber('')}
                />
              ) : (
                <CustomInput
                  type="email"
                  placeholder="Nhập email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onClear={() => setEmail('')}
                />
              )}

              <CustomInput
                type="password"
                placeholder="Nhập mật khẩu (*)"
                secureTextEntry
                showToggle
                value={password}
                onChangeText={setPassword}
              />

              <PrimaryButton
                text="ĐĂNG NHẬP"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.loginButton}
              />

              <TouchableOpacity
                style={styles.biometricButton}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="fingerprint" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.biometricText}>Đăng nhập với sinh trắc học</Text>
              </TouchableOpacity>

              <View style={styles.linksRow}>
                <Text style={styles.linkText}>Bạn quên mật khẩu? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.linkAction}>Quên mật khẩu</Text>
                </TouchableOpacity>
              </View>
            </AuthCard>

            {/* Bottom Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerAction}>Đăng ký</Text>
              </TouchableOpacity>
            </View>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <SocialButton
                icon="google"
                text="Google"
                onPress={() => { }}
                style={styles.socialMargin}
              />
              <SocialButton
                icon="apple"
                text="Apple"
                onPress={() => { }}
              />
            </View>

            {/* Bottom Banner */}
            <View style={styles.bannerContainer}>
              <Text style={styles.bannerText}>
                Nếu bạn là <Text style={styles.boldText}>CHỦ SÂN</Text> hoặc <Text style={styles.boldText}>NHÂN VIÊN</Text>,
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.bannerAction}>
                  Bấm vào đây để tải ứng dụng ALOBO - Quản lý sân thể thao!
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  placeholder: {
    width: 44, // Equal to backButton area
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    marginTop: 10,
    marginBottom: 24,
  },
  loginButton: {
    marginTop: 12,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  biometricText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  linkAction: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.WHITE,
  },
  footerAction: {
    fontSize: 15,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  socialContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 30,
  },
  socialMargin: {
    marginRight: 16,
  },
  bannerContainer: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.ACCENT,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
  },
  bannerAction: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';

export const VenueRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Pickleball',
    price: '',
    description: '',
    lat: 0,
    lng: 0,
  });
  const [hasLicense, setHasLicense] = useState(false);

  const handleLocationSelected = (location: { lat: number; lng: number, address: string }) => {
    setFormData({
      ...formData,
      lat: location.lat,
      lng: location.lng,
      address: location.address || formData.address,
    });
  };

  const handleRegister = () => {
    if (!formData.name || !formData.address || !formData.price || !formData.lat) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc và chọn vị trí trên bản đồ (*)');
      return;
    }
    Alert.alert('Thành công', 'Hồ sơ đăng ký sân của bạn đã được gửi và đang chờ duyệt.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký sân mới</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Thông tin cơ bản</Text>
          <CustomInput
            type="email"
            placeholder="Tên sân (*)"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <CustomInput
            type="email"
            placeholder="Địa chỉ chi tiết (*)"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
          <CustomInput
            type="email"
            placeholder="Giá thuê cơ bản (vnđ/giờ) (*)"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Vị trí trên bản đồ (*)</Text>
          <TouchableOpacity 
            style={[styles.mapPlaceholder, formData.lat !== 0 && styles.mapSelected]}
            onPress={() => navigation.navigate('VenueLocationPicker', {
              onLocationSelected: handleLocationSelected,
              initialLocation: formData.lat !== 0 ? { lat: formData.lat, lng: formData.lng, address: formData.address } : null
            })}
          >
            <MaterialCommunityIcons 
              name={formData.lat !== 0 ? "map-check" : "map-marker-radius"} 
              size={40} 
              color={formData.lat !== 0 ? COLORS.PRIMARY : COLORS.GRAY_MEDIUM} 
            />
            <Text style={[styles.mapText, formData.lat !== 0 && styles.mapTextSelected]}>
              {formData.lat !== 0 
                ? `Đã chọn: ${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` 
                : "Bấm để chọn vị trí trên bản đồ"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Hình ảnh & Giấy phép</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            <TouchableOpacity style={styles.addImageBtn}>
              <MaterialCommunityIcons name="camera-plus" size={30} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
            {/* Mocked uploaded images */}
            <View style={styles.mockImage} />
            <View style={styles.mockImage} />
          </ScrollView>

          <TouchableOpacity
            style={styles.licenseUpload}
            onPress={() => setHasLicense(!hasLicense)}
          >
            <MaterialCommunityIcons
              name={hasLicense ? 'file-check' : 'file-upload-outline'}
              size={24}
              color={hasLicense ? '#388E3C' : COLORS.GRAY_MEDIUM}
            />
            <Text style={[styles.licenseText, hasLicense && { color: '#388E3C' }]}>
              {hasLicense ? 'Đã tải lên giấy phép kinh doanh' : 'Tải lên giấy phép kinh doanh (nếu có)'}
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          text="GỬI ĐĂNG KÝ"
          onPress={handleRegister}
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtnHeader: {
    marginLeft: -5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
  },
  formSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#F0F4F8',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1D9E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapText: {
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  mapSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.PRIMARY,
    borderStyle: 'solid',
  },
  mapTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  imageScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 11,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 5,
  },
  mockImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#EEE',
    marginLeft: 12,
  },
  licenseUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    gap: 12,
  },
  licenseText: {
    fontSize: 14,
    color: '#666',
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: '#1976D2',
  },
});

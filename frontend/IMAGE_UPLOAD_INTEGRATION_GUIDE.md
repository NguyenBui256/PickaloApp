/**
 * Enhanced Venue Registration Screen with Image Upload Integration
 *
 * This is an example of how to integrate the new MinIO image upload functionality
 * into your existing VenueRegistrationScreen.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '@theme/colors';
import { CustomInput } from '../../../components/CustomInput';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useNavigation } from '@react-navigation/native';
import { selectAndUploadVenueImages, getImageUrl } from '../../../utils/image-upload-helper';

export const VenueRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Pickleball',
    price: '',
    description: '',
  });

  // New state for images
  const [venueImages, setVenueImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasLicense, setHasLicense] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.address || !formData.price) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    try {
      // Here you would also include the venue images in your venue creation
      // const venueData = {
      //   ...formData,
      //   images: venueImages,
      // };

      // await createVenue(venueData);

      Alert.alert('Thành công', 'Hồ sơ đăng ký sân của bạn đã được gửi và đang chờ duyệt.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đăng ký sân. Vui lòng thử lại.');
    }
  };

  const handleAddImages = async () => {
    // For new venue registration, we'll upload images after venue creation
    // This is a placeholder for when you get the venue ID
    Alert.alert(
      'Thông báo',
      'Bạn cần đăng ký sân trước khi tải lên hình ảnh. Sau khi đăng ký, bạn có thể thêm hình ảnh vào sân.'
    );
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            const updatedImages = venueImages.filter((_, i) => i !== index);
            setVenueImages(updatedImages);
          }
        }
      ]
    );
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
        {/* Basic Information Section */}
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

        {/* Map Location Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Vị trí trên bản đồ</Text>
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-marker-radius" size={40} color={COLORS.PRIMARY} />
            <Text style={styles.mapText}>Bấm để chọn vị trí trên bản đồ</Text>
          </View>
        </View>

        {/* Images Section - ENHANCED */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Hình ảnh sân</Text>
          <Text style={styles.helperText}>
            Tải lên hình ảnh sân của bạn (tối đa 5 hình, mỗi hình tối đa 5MB)
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {/* Add Image Button */}
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handleAddImages}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="camera-plus"
                    size={30}
                    color={isUploading ? COLORS.GRAY_LIGHT : COLORS.GRAY_MEDIUM}
                  />
                  <Text style={[
                    styles.addImageText,
                    isUploading && styles.addImageTextDisabled
                  ]}>
                    Thêm ảnh
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Uploaded Images */}
            {venueImages.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageContainer}
                onLongPress={() => handleRemoveImage(index)}
              >
                <Image
                  source={{ uri: getImageUrl(imageUrl) }}
                  style={styles.venueImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#FF4444"
                    style={styles.removeIconBg}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* Placeholder for visual feedback when no images */}
            {venueImages.length === 0 && !isUploading && (
              <>
                <View style={styles.placeholderImage} />
                <View style={styles.placeholderImage} />
              </>
            )}
          </ScrollView>

          {venueImages.length > 0 && (
            <Text style={styles.imageCount}>
              {venueImages.length} hình đã chọn
            </Text>
          )}
        </View>

        {/* License Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Giấy phép & Tài liệu</Text>
          <TouchableOpacity
            style={styles.licenseUpload}
            onPress={() => setHasLicense(!hasLicense)}
          >
            <MaterialCommunityIcons
              name={hasLicense ? 'file-check' : 'file-upload-outline'}
              size={24}
              color={hasLicense ? '#388E3C' : COLORS.GRAY_MEDIUM}
            />
            <Text style={styles.licenseText}>
              {hasLicense ? 'Đã tải giấy phép kinh doanh' : 'Tải lên giấy phép kinh doanh'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <PrimaryButton
            title="Đăng ký sân"
            onPress={handleRegister}
            disabled={isUploading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtnHeader: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginBottom: 8,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  mapText: {
    marginTop: 8,
    color: COLORS.GRAY_MEDIUM,
    fontSize: 14,
  },
  imageScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addImageText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
  },
  addImageTextDisabled: {
    color: COLORS.GRAY_LIGHT,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginRight: 8,
    position: 'relative',
  },
  venueImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  removeIconBg: {
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    opacity: 0.5,
  },
  imageCount: {
    fontSize: 12,
    color: COLORS.GRAY_MEDIUM,
    marginTop: 4,
  },
  licenseUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  licenseText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.GRAY_MEDIUM,
  },
  submitSection: {
    marginTop: 8,
    marginBottom: 24,
  },
});